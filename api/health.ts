interface VercelRequestLike {
  method?: string;
}

interface VercelResponseLike {
  status: (code: number) => VercelResponseLike;
  json: (body: unknown) => void;
}

export default async function handler(
  req: VercelRequestLike,
  res: VercelResponseLike,
) {
  if (req.method !== "GET") {
    res
      .status(405)
      .json({
        ok: false,
        code: "METHOD_NOT_ALLOWED",
        error: "Method not allowed.",
      });
    return;
  }

  res.status(200).json({
    ok: true,
    service: "moodflow-api",
    timestamp: new Date().toISOString(),
  });
}
