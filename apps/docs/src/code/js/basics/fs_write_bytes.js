import { Session } from '@e2b/sdk'

const session = await Session.create({
  id: 'Nodejs',
  apiKey: process.env.E2B_API_KEY,
})

// Let's convert string to bytes for testing purposes
const encoder = new TextEncoder('utf-8')
const contentInBytes = encoder.encode('Hello World!')

// `writeBytes` accepts a Uint8Array and saves it to a file inside the playground
await session.filesystem.writeBytes('/file', contentInBytes) // $HighlightLine

// We can read the file back to verify the content
const fileContent = await session.filesystem.read('/file')

// This will print 'Hello World!'
console.log(fileContent)

await session.close()
