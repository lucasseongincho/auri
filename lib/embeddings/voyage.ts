// Server-side only — VOYAGE_API_KEY must never appear in client bundles.
// Import only from server components, API routes, or other server-side lib files.

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'
const VOYAGE_MODEL = 'voyage-4-lite'
const BATCH_LIMIT = 128

interface VoyageEmbeddingObject {
  object: 'embedding'
  embedding: number[]
  index: number
}

interface VoyageEmbeddingResponse {
  object: 'list'
  data: VoyageEmbeddingObject[]
  model: string
  usage: { total_tokens: number }
}

async function embedBatch(
  texts: string[],
  inputType: 'query' | 'document',
  apiKey: string
): Promise<number[][]> {
  const res = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: texts,
      model: VOYAGE_MODEL,
      input_type: inputType,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Voyage API error ${res.status}: ${body}`)
  }

  const json = (await res.json()) as VoyageEmbeddingResponse

  // Sort by index to guarantee input order, then extract embeddings
  return json.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding)
}

export async function embedTexts(
  texts: string[],
  inputType: 'query' | 'document'
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) {
    throw new Error('VOYAGE_API_KEY environment variable is not set')
  }

  if (texts.length === 0) return []

  if (texts.length <= BATCH_LIMIT) {
    return embedBatch(texts, inputType, apiKey)
  }

  // Chunk into sequential batches of BATCH_LIMIT to respect API limits
  const results: number[][] = []
  for (let i = 0; i < texts.length; i += BATCH_LIMIT) {
    const chunk = texts.slice(i, i + BATCH_LIMIT)
    const batchEmbeddings = await embedBatch(chunk, inputType, apiKey)
    results.push(...batchEmbeddings)
  }
  return results
}
