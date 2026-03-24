import type { JournalEntry } from "../../types/journal";
import axios from "axios";

const AI_REQUEST_TIMEOUT_MS = 45_000;

interface AiRequestOptions {
  question?: string;
  reflection?: string;
}

function serializeEntries(entries: JournalEntry[]) {
  return entries.slice(0, 8).map((entry) => ({
    title: entry.title,
    mood: entry.mood,
    energy: entry.energy,
    tags: entry.tags,
    note: entry.note,
    createdAt: entry.createdAt,
  }));
}

export async function getAiReflection(
  entries: JournalEntry[],
  signal?: AbortSignal,
  options?: AiRequestOptions,
) {
  try {
    const response = await axios.post<{
      ok?: boolean;
      reply?: string;
      error?: string;
      code?: string;
    }>(
      "/api/reflect",
      {
        entries: serializeEntries(entries),
        question: options?.question,
        reflection: options?.reflection,
      },
      {
        timeout: AI_REQUEST_TIMEOUT_MS,
        signal,
      },
    );

    const data = response.data;

    const reply = data.reply?.trim();
    if (!reply) {
      throw new Error(
        "AI service returned an empty reflection. Please try again.",
      );
    }

    return reply;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        throw new Error(
          "The reflection request timed out. Please try again in a few seconds.",
        );
      }

      if (error.code === "ERR_CANCELED") {
        throw new Error("The reflection request was canceled.");
      }

      const serverMessage =
        (typeof error.response?.data?.error === "string" &&
          error.response.data.error.trim()) ||
        "";

      if (serverMessage) {
        throw new Error(serverMessage);
      }

      if (error.response?.status) {
        throw new Error(
          `AI reflection failed with status ${error.response.status}. Please try again.`,
        );
      }

      throw new Error(
        "Network error while contacting AI reflection service. Please try again.",
      );
    }

    throw new Error(
      "Unexpected error while generating AI reflection. Please try again.",
    );
  }
}
