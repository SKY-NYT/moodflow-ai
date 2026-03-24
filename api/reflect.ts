interface ReflectionEntry {
  title?: string;
  mood?: string;
  energy?: number;
  tags?: string[];
  note?: string;
  createdAt?: string;
}

interface OpenRouterResponse {
  id?: string;
  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }>;
  error?: {
    type?: string;
    code?: string | number;
    message?: string;
  };
}

interface VercelRequestLike {
  method?: string;
  body?: unknown;
}

interface ReflectRequestBody {
  entries?: ReflectionEntry[];
  question?: string;
  reflection?: string;
}

interface VercelResponseLike {
  status: (code: number) => VercelResponseLike;
  json: (body: unknown) => void;
}

declare const process: {
  env: Record<string, string | undefined>;
};

const OPENROUTER_TIMEOUT_MS = 28_000;
const MAX_ENTRIES = 5;
const MAX_NOTE_CHARS = 900;
const MAX_OUTPUT_TOKENS = 420;
const DEFAULT_OPENROUTER_MODEL = "openrouter/auto";

function isAbortError(error: unknown) {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : typeof error === "object" &&
        error !== null &&
        "name" in error &&
        (error as { name?: string }).name === "AbortError";
}

function sendJson(
  res: VercelResponseLike,
  status: number,
  payload: Record<string, unknown>,
) {
  res.status(status).json(payload);
}

function jsonError(
  res: VercelResponseLike,
  status: number,
  code: string,
  message: string,
) {
  sendJson(res, status, { ok: false, code, error: message });
}

function isDevRuntime() {
  return process.env.NODE_ENV !== "production";
}

function devLog(label: string, meta: Record<string, unknown>) {
  if (!isDevRuntime()) return;
  console.log(`[api/reflect] ${label}`, meta);
}

function buildPrompt(entries: ReflectionEntry[]) {
  const safeEntries = entries.slice(0, MAX_ENTRIES).map((entry) => ({
    title: String(entry.title ?? "Untitled reflection").slice(0, 120),
    mood: String(entry.mood ?? "Neutral").slice(0, 30),
    energy:
      typeof entry.energy === "number" && Number.isFinite(entry.energy)
        ? Math.max(1, Math.min(10, Math.round(entry.energy)))
        : 5,
    tags: Array.isArray(entry.tags)
      ? entry.tags.slice(0, 6).map((tag) => String(tag).slice(0, 24))
      : [],
    note: String(entry.note ?? "").slice(0, MAX_NOTE_CHARS),
    createdAt: String(entry.createdAt ?? ""),
  }));

  return (
    "Review the journal data below and respond with exactly these sections:\n" +
    "## Pattern\n" +
    "## Gentle suggestion\n" +
    "## Next journal prompt\n\n" +
    "Each section should be concise and useful. Base your answer only on the journal context provided.\n\n" +
    JSON.stringify(safeEntries, null, 2)
  );
}

function buildQuestionPrompt(
  entries: ReflectionEntry[],
  reflection: string,
  question: string,
) {
  const safeEntries = entries.slice(0, MAX_ENTRIES).map((entry) => ({
    title: String(entry.title ?? "Untitled reflection").slice(0, 120),
    mood: String(entry.mood ?? "Neutral").slice(0, 30),
    energy:
      typeof entry.energy === "number" && Number.isFinite(entry.energy)
        ? Math.max(1, Math.min(10, Math.round(entry.energy)))
        : 5,
    tags: Array.isArray(entry.tags)
      ? entry.tags.slice(0, 6).map((tag) => String(tag).slice(0, 24))
      : [],
    note: String(entry.note ?? "").slice(0, MAX_NOTE_CHARS),
    createdAt: String(entry.createdAt ?? ""),
  }));

  return (
    "You are answering a follow-up question about a previous AI reflection.\n" +
    "Only use the journal context and prior reflection below. Keep the answer practical and concise.\n\n" +
    "## Prior AI reflection\n" +
    reflection.slice(0, 2400) +
    "\n\n## User question\n" +
    question.slice(0, 600) +
    "\n\n## Journal context\n" +
    JSON.stringify(safeEntries, null, 2)
  );
}

function getOutputText(data: OpenRouterResponse) {
  return data.choices?.[0]?.message?.content?.trim() || "";
}

function parseRequestBody(body: unknown): {
  entries: ReflectionEntry[];
  question: string;
  reflection: string;
} {
  let parsed: ReflectRequestBody | null = null;

  if (typeof body === "string") {
    try {
      parsed = JSON.parse(body) as ReflectRequestBody;
    } catch {
      parsed = null;
    }
  } else if (typeof body === "object" && body !== null) {
    parsed = body as ReflectRequestBody;
  }

  const entries = Array.isArray(parsed?.entries) ? parsed.entries : [];
  const question = String(parsed?.question ?? "").trim();
  const reflection = String(parsed?.reflection ?? "").trim();

  return { entries, question, reflection };
}

function buildOpenRouterBody(model: string, prompt: string) {
  return {
    model,
    messages: [
      {
        role: "system",
        content:
          "You are MoodFlow AI, a calm and supportive reflection coach inside a journaling app. " +
          "Help the user notice patterns, reframe gently, and take one small next step. " +
          "Do not diagnose conditions, claim certainty, or present yourself as a therapist. " +
          "Keep the tone warm, grounded, and professional.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: MAX_OUTPUT_TOKENS,
    temperature: 0.6,
  };
}

export default async function handler(
  req: VercelRequestLike,
  res: VercelResponseLike,
) {
  if (req.method !== "POST") {
    jsonError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = (
    process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL
  ).trim();
  const appUrl = (
    process.env.OPENROUTER_SITE_URL || "http://localhost:5173"
  ).trim();
  const appTitle = (process.env.OPENROUTER_APP_NAME || "MoodFlow AI").trim();

  devLog("env_check", {
    hasApiKey: Boolean(apiKey),
    model,
  });

  if (!apiKey) {
    jsonError(
      res,
      500,
      "MISSING_OPENROUTER_API_KEY",
      "Missing OPENROUTER_API_KEY on the server. Add it in Vercel Environment Variables and redeploy.",
    );
    return;
  }

  if (!model) {
    jsonError(
      res,
      500,
      "INVALID_OPENROUTER_MODEL",
      "OPENROUTER_MODEL is empty. Set OPENROUTER_MODEL or remove it to use the default model.",
    );
    return;
  }

  try {
    const { entries, question, reflection } = parseRequestBody(req.body);

    devLog("request_received", {
      entriesCount: entries.length,
    });

    if (entries.length === 0) {
      jsonError(
        res,
        400,
        "NO_ENTRIES",
        "Add at least one journal entry before asking AI to reflect.",
      );
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      OPENROUTER_TIMEOUT_MS,
    );

    let openRouterResponse: Response;
    const prompt =
      question && reflection
        ? buildQuestionPrompt(entries, reflection, question)
        : buildPrompt(entries);

    try {
      openRouterResponse = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": appUrl,
            "X-Title": appTitle,
          },
          body: JSON.stringify(buildOpenRouterBody(model, prompt)),
          signal: controller.signal,
        },
      );

      // Some slugs like `...:free` may be unavailable for the account/region.
      // Retry once with suffix removed before returning a model error.
      if (!openRouterResponse.ok && model.includes(":")) {
        const firstError = (await openRouterResponse
          .json()
          .catch(() => ({}))) as OpenRouterResponse;
        const firstMessage = firstError.error?.message?.toLowerCase() || "";
        if (
          openRouterResponse.status === 404 &&
          firstMessage.includes("no endpoints found")
        ) {
          const fallbackModel = model.split(":")[0]?.trim();
          if (fallbackModel) {
            devLog("openrouter_model_fallback", {
              from: model,
              to: fallbackModel,
            });
            openRouterResponse = await fetch(
              "https://openrouter.ai/api/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`,
                  "HTTP-Referer": appUrl,
                  "X-Title": appTitle,
                },
                body: JSON.stringify(
                  buildOpenRouterBody(fallbackModel, prompt),
                ),
                signal: controller.signal,
              },
            );
          }
        }
      }
    } catch (error) {
      if (isAbortError(error)) {
        jsonError(
          res,
          504,
          "OPENROUTER_TIMEOUT",
          "OpenRouter timed out while generating your reflection. Please try again.",
        );
        return;
      }
      jsonError(
        res,
        502,
        "OPENROUTER_NETWORK_ERROR",
        "Could not reach OpenRouter. Check your network and try again.",
      );
      return;
    } finally {
      clearTimeout(timeoutId);
    }

    devLog("openrouter_response", {
      status: openRouterResponse.status,
    });

    const data = (await openRouterResponse
      .json()
      .catch(() => ({}))) as OpenRouterResponse;

    if (!openRouterResponse.ok) {
      devLog("openrouter_error", {
        status: openRouterResponse.status,
        error: data.error ?? null,
      });

      if (
        openRouterResponse.status === 401 ||
        openRouterResponse.status === 403
      ) {
        jsonError(
          res,
          401,
          "OPENROUTER_INVALID_API_KEY",
          "OpenRouter rejected the API key. Verify OPENROUTER_API_KEY and try again.",
        );
        return;
      }

      if (openRouterResponse.status === 429) {
        jsonError(
          res,
          429,
          "OPENROUTER_RATE_LIMIT_OR_QUOTA",
          "OpenRouter rate limit or quota reached. Check billing/credits and retry shortly.",
        );
        return;
      }

      if (openRouterResponse.status === 400) {
        const modelErrorMessage = data.error?.message?.trim() || "";
        const errorCode = String(data.error?.code ?? "").toLowerCase();
        if (
          modelErrorMessage.toLowerCase().includes("model") ||
          errorCode.includes("model")
        ) {
          jsonError(
            res,
            400,
            "OPENROUTER_MODEL_ERROR",
            modelErrorMessage ||
              "OpenRouter model error. Verify OPENROUTER_MODEL and try again.",
          );
          return;
        }
      }

      if (openRouterResponse.status === 404) {
        const modelErrorMessage = data.error?.message?.trim() || "";
        if (
          modelErrorMessage.toLowerCase().includes("model") ||
          modelErrorMessage.toLowerCase().includes("not found")
        ) {
          jsonError(
            res,
            400,
            "OPENROUTER_MODEL_ERROR",
            modelErrorMessage ||
              "OpenRouter model was not found. Verify OPENROUTER_MODEL and try again.",
          );
          return;
        }
      }

      jsonError(
        res,
        openRouterResponse.status,
        "OPENROUTER_API_ERROR",
        data.error?.message?.trim() ||
          "OpenRouter could not generate a reflection right now.",
      );
      return;
    }

    const reply =
      getOutputText(data) ||
      "I could not generate a reflection yet. Please try again with a little more detail.";

    sendJson(res, 200, { ok: true, reply });
  } catch (error) {
    devLog("handler_exception", {
      message: error instanceof Error ? error.message : String(error),
    });
    jsonError(
      res,
      500,
      "INTERNAL_ERROR",
      "Something went wrong while generating your AI reflection. Please try again.",
    );
  }
}
