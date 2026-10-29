import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createReadStream } from 'node:fs'
import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const audioExtensions = new Set(['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac', '.webm'])
const mapImageTypes = new Map([['.png', 'image/png'], ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'], ['.webp', 'image/webp']])

function sendJson(response, status, value) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(value))
}

function readBody(request, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    request.on('data', (chunk) => {
      size += chunk.length
      if (size > maxBytes) {
        reject(new Error('Request body exceeds the allowed size.'))
        request.resume()
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => resolve(Buffer.concat(chunks)))
    request.on('error', reject)
  })
}

function localStorageApi() {
  return {
    name: 'ielts-local-storage-api',
    configureServer(server) {
      server.middlewares.use('/audio', async (request, response, next) => {
        if (request.method !== 'GET' && request.method !== 'HEAD') return next()
        try {
          const encodedPath = new URL(request.url, 'http://localhost').pathname
          const filename = decodeURIComponent(encodedPath.replace(/^\/+/, ''))
          if (!filename || path.basename(filename) !== filename) return sendJson(response, 400, { error: 'Invalid audio file path.' })
          const audioDirectory = path.join(projectRoot, 'public', 'audio')
          const filePath = path.join(audioDirectory, filename)
          const metadata = await stat(filePath).catch(() => null)
          if (!metadata?.isFile()) return sendJson(response, 404, { error: 'Audio file not found.' })

          const contentTypes = { '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.aac': 'audio/aac', '.flac': 'audio/flac', '.webm': 'audio/webm' }
          response.setHeader('Content-Type', contentTypes[path.extname(filename).toLowerCase()] ?? 'application/octet-stream')
          response.setHeader('Accept-Ranges', 'bytes')
          const range = request.headers.range?.match(/^bytes=(\d*)-(\d*)$/)
          if (range) {
            const start = range[1] ? Number(range[1]) : 0
            const end = Math.min(range[2] ? Number(range[2]) : metadata.size - 1, metadata.size - 1)
            if (start > end || start >= metadata.size) {
              response.statusCode = 416
              response.setHeader('Content-Range', `bytes */${metadata.size}`)
              return response.end()
            }
            response.statusCode = 206
            response.setHeader('Content-Range', `bytes ${start}-${end}/${metadata.size}`)
            response.setHeader('Content-Length', end - start + 1)
            if (request.method === 'HEAD') return response.end()
            return createReadStream(filePath, { start, end }).pipe(response)
          }
          response.statusCode = 200
          response.setHeader('Content-Length', metadata.size)
          if (request.method === 'HEAD') return response.end()
          return createReadStream(filePath).pipe(response)
        } catch (error) {
          sendJson(response, 400, { error: error.message })
        }
      })

      server.middlewares.use('/__local_api/audio-files', async (request, response, next) => {
        if (request.method !== 'GET') return next()
        try {
          const audioDirectory = path.join(projectRoot, 'public', 'audio')
          const entries = await readdir(audioDirectory, { withFileTypes: true }).catch(() => [])
          const files = entries.filter((entry) => entry.isFile() && audioExtensions.has(path.extname(entry.name).toLowerCase())).map((entry) => ({
            name: entry.name,
            url: `/audio/${encodeURIComponent(entry.name)}`,
          })).sort((left, right) => left.name.localeCompare(right.name))
          sendJson(response, 200, { files })
        } catch (error) {
          sendJson(response, 500, { error: error.message })
        }
      })

      server.middlewares.use('/__local_api/save-data', async (request, response, next) => {
        if (request.method !== 'POST') return next()
        try {
          const body = JSON.parse((await readBody(request, 12 * 1024 * 1024)).toString('utf8'))
          const directoryName = body.kind === 'listening' ? 'tests' : body.kind === 'speaking' ? 'speaking' : ''
          const id = String(body.data?.id ?? '')
          if (!directoryName || !/^[a-z0-9][a-z0-9-]*$/.test(id)) return sendJson(response, 400, { error: 'Invalid data kind or id.' })
          const directory = path.join(projectRoot, 'src', 'data', directoryName)
          await mkdir(directory, { recursive: true })
          const destination = path.join(directory, `${id}.json`)
          const temporary = `${destination}.${process.pid}.tmp`
          await writeFile(temporary, `${JSON.stringify(body.data, null, 2)}\n`, 'utf8')
          await rename(temporary, destination)
          sendJson(response, 200, { saved: true, path: `src/data/${directoryName}/${id}.json` })
        } catch (error) {
          sendJson(response, error instanceof SyntaxError ? 400 : 500, { error: error.message })
        }
      })

      server.middlewares.use('/__local_api/replace-data', async (request, response, next) => {
        if (request.method !== 'POST') return next()
        try {
          const body = JSON.parse((await readBody(request, 12 * 1024 * 1024)).toString('utf8'))
          const directoryName = body.kind === 'listening' ? 'tests' : body.kind === 'speaking' ? 'speaking' : ''
          const oldId = String(body.oldId ?? '')
          const id = String(body.data?.id ?? '')
          if (!directoryName || !/^[a-z0-9][a-z0-9-]*$/.test(oldId) || !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
            return sendJson(response, 400, { error: 'Invalid data kind or id.' })
          }
          const directory = path.join(projectRoot, 'src', 'data', directoryName)
          await mkdir(directory, { recursive: true })
          const destination = path.join(directory, `${id}.json`)
          const temporary = `${destination}.${process.pid}.tmp`
          await writeFile(temporary, `${JSON.stringify(body.data, null, 2)}\n`, 'utf8')
          await rename(temporary, destination)
          if (oldId !== id) {
            try {
              await unlink(path.join(directory, `${oldId}.json`))
            } catch (error) {
              if (error.code !== 'ENOENT') {
                await unlink(destination).catch(() => {})
                throw error
              }
            }
          }
          sendJson(response, 200, { saved: true, path: `src/data/${directoryName}/${id}.json` })
        } catch (error) {
          sendJson(response, error instanceof SyntaxError ? 400 : error.code === 'ENOENT' ? 404 : 500, { error: error.message })
        }
      })

      server.middlewares.use('/__local_api/delete-data', async (request, response, next) => {
        if (request.method !== 'POST') return next()
        try {
          const body = JSON.parse((await readBody(request, 1024 * 1024)).toString('utf8'))
          const directoryName = body.kind === 'listening' ? 'tests' : body.kind === 'speaking' ? 'speaking' : ''
          const id = String(body.id ?? '')
          if (!directoryName || !/^[a-z0-9][a-z0-9-]*$/.test(id)) return sendJson(response, 400, { error: 'Invalid data kind or id.' })
          const destination = path.join(projectRoot, 'src', 'data', directoryName, `${id}.json`)
          await unlink(destination).catch((error) => {
            if (error.code !== 'ENOENT') throw error
          })
          sendJson(response, 200, { deleted: true, path: `src/data/${directoryName}/${id}.json` })
        } catch (error) {
          sendJson(response, error instanceof SyntaxError ? 400 : error.code === 'ENOENT' ? 404 : 500, { error: error.message })
        }
      })

      server.middlewares.use('/__local_api/delete-speaking-set', async (request, response, next) => {
        if (request.method !== 'POST') return next()
        try {
          const body = JSON.parse((await readBody(request, 1024 * 1024)).toString('utf8'))
          const id = String(body.id ?? '')
          const setId = String(body.setId ?? '')
          if (!/^[a-z0-9][a-z0-9-]*$/.test(id) || !/^[a-z0-9][a-z0-9-]*$/.test(setId)) {
            return sendJson(response, 400, { error: 'Invalid speaking lesson or set id.' })
          }
          const destination = path.join(projectRoot, 'src', 'data', 'speaking', `${id}.json`)
          const lesson = JSON.parse(await readFile(destination, 'utf8'))
          if (!Array.isArray(lesson.sets)) return sendJson(response, 400, { error: 'This speaking lesson has no sets.' })
          lesson.sets = lesson.sets.filter((set) => set.id !== setId)
          if (!lesson.sets.length) {
            await unlink(destination)
            return sendJson(response, 200, { deleted: true, lessonDeleted: true })
          }
          const temporary = `${destination}.${process.pid}.tmp`
          await writeFile(temporary, `${JSON.stringify(lesson, null, 2)}\n`, 'utf8')
          await rename(temporary, destination)
          sendJson(response, 200, { deleted: true, lessonDeleted: false })
        } catch (error) {
          sendJson(response, error instanceof SyntaxError ? 400 : error.code === 'ENOENT' ? 404 : 500, { error: error.message })
        }
      })

      server.middlewares.use('/__local_api/delete-audio', async (request, response, next) => {
        if (request.method !== 'POST') return next()
        try {
          const body = JSON.parse((await readBody(request, 1024 * 1024)).toString('utf8'))
          const filename = String(body.name ?? '')
          const extension = path.extname(filename).toLowerCase()
          if (!filename || path.basename(filename) !== filename || !audioExtensions.has(extension)) return sendJson(response, 400, { error: 'Invalid audio file name.' })
          await unlink(path.join(projectRoot, 'public', 'audio', filename))
          sendJson(response, 200, { deleted: true, name: filename })
        } catch (error) {
          sendJson(response, error instanceof SyntaxError ? 400 : error.code === 'ENOENT' ? 404 : 500, { error: error.message })
        }
      })

      server.middlewares.use('/__local_api/upload-audio', async (request, response, next) => {
        if (request.method !== 'POST') return next()
        try {
          const requestUrl = new URL(request.url, 'http://localhost')
          const filename = requestUrl.searchParams.get('filename') ?? ''
          const extension = path.extname(filename).toLowerCase()
          if (!filename || path.basename(filename) !== filename || !audioExtensions.has(extension)) return sendJson(response, 400, { error: 'Choose a supported audio file name.' })
          const content = await readBody(request, 150 * 1024 * 1024)
          const audioDirectory = path.join(projectRoot, 'public', 'audio')
          await mkdir(audioDirectory, { recursive: true })
          const destination = path.join(audioDirectory, filename)
          const temporary = `${destination}.${process.pid}.tmp`
          await writeFile(temporary, content)
          await rename(temporary, destination)
          sendJson(response, 200, { saved: true, name: filename, url: `/audio/${encodeURIComponent(filename)}` })
        } catch (error) {
          sendJson(response, 500, { error: error.message })
        }
      })

      server.middlewares.use('/__local_api/upload-map-image', async (request, response, next) => {
        if (request.method !== 'POST') return next()
        try {
          const requestUrl = new URL(request.url, 'http://localhost')
          const filename = requestUrl.searchParams.get('filename') ?? ''
          const extension = path.extname(filename).toLowerCase()
          if (!filename || path.basename(filename) !== filename || !mapImageTypes.has(extension)) return sendJson(response, 400, { error: 'Choose a PNG, JPG, or WebP map image.' })
          const content = await readBody(request, 20 * 1024 * 1024)
          const imageDirectory = path.join(projectRoot, 'public', 'images')
          await mkdir(imageDirectory, { recursive: true })
          const destination = path.join(imageDirectory, filename)
          const temporary = `${destination}.${process.pid}.tmp`
          await writeFile(temporary, content)
          await rename(temporary, destination)
          sendJson(response, 200, { saved: true, name: filename, url: `/images/${encodeURIComponent(filename)}` })
        } catch (error) {
          sendJson(response, 500, { error: error.message })
        }
      })

      server.middlewares.use('/__local_api/upload-speaking-image', async (request, response, next) => {
        if (request.method !== 'POST') return next()
        try {
          const requestUrl = new URL(request.url, 'http://localhost')
          const filename = requestUrl.searchParams.get('filename') ?? ''
          const extension = path.extname(filename).toLowerCase()
          if (!filename || path.basename(filename) !== filename || !mapImageTypes.has(extension)) return sendJson(response, 400, { error: 'Choose a PNG, JPG, or WebP image.' })
          const content = await readBody(request, 20 * 1024 * 1024)
          const imageDirectory = path.join(projectRoot, 'public', 'images', 'speaking')
          await mkdir(imageDirectory, { recursive: true })
          const destination = path.join(imageDirectory, filename)
          const temporary = `${destination}.${process.pid}.tmp`
          await writeFile(temporary, content)
          await rename(temporary, destination)
          sendJson(response, 200, { saved: true, name: filename, url: `/images/speaking/${encodeURIComponent(filename)}` })
        } catch (error) {
          sendJson(response, 500, { error: error.message })
        }
      })

      server.middlewares.use('/__local_api/delete-map-image', async (request, response, next) => {
        if (request.method !== 'POST') return next()
        try {
          const body = JSON.parse((await readBody(request, 1024 * 1024)).toString('utf8'))
          const imageUrl = String(body.url ?? '')
          const filename = decodeURIComponent(imageUrl.replace(/^\/images\//, ''))
          const extension = path.extname(filename).toLowerCase()
          if (!imageUrl.startsWith('/images/') || !filename || path.basename(filename) !== filename || !mapImageTypes.has(extension)) return sendJson(response, 400, { error: 'Invalid map image path.' })
          await unlink(path.join(projectRoot, 'public', 'images', filename))
          sendJson(response, 200, { deleted: true, name: filename })
        } catch (error) {
          sendJson(response, error instanceof SyntaxError ? 400 : error.code === 'ENOENT' ? 404 : 500, { error: error.message })
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), localStorageApi()],
server: {
    host: '0.0.0.0',
    open: true
  }
})