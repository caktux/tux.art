import { CID } from 'multiformats/cid'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

export const subdomainGatewayPattern = /^https?:\/\/([^/]+)\.(ip[fn]s)\.[^/?]+\/?(\S+)?/
export const ipfsAddressPattern = /^(ipfs):\/\/(?:ipfs\/)*([^/?#]+)\/?(\S+)?/
export const pathGatewayPattern = /^https?:\/\/[^/]+\/(ip[fn]s)\/([^/?#]+)\/?(\S+)?/
export const pathPattern = /^\/(ip[fn]s)\/([^/?#]+)\/?(\S+)?/


/**
 * @param {any} input
 */
export function isString (input: any) {
  return typeof input === 'string'
}

/**
 * @param {Uint8Array | string} input
 */
export function convertToString (input: any) {
  if (input instanceof Uint8Array) {
    return uint8ArrayToString(input, 'base58btc')
  }

  if (isString(input)) {
    return input
  }

  return false
}

/**
 * @param {*} hash
 */
export function isCID (hash: any) {
  try {
    if (typeof hash === 'string') {
      return Boolean(CID.parse(hash))
    }

    if (hash instanceof Uint8Array) {
      return Boolean(CID.decode(hash))
    }

    return Boolean(CID.asCID(hash))
  } catch (e) {
    return false
  }
}

/**
 * @param {string | Uint8Array} input
 * @param {RegExp | string} pattern
 * @param {number} [protocolMatch=1]
 * @param {number} [hashMatch=2]
 */
export function getIpfsHash (input: any) {
  const formatted = convertToString(input)
  if (!formatted)
    return false

  let match = false as any
  let pattern = false as any

  for (pattern of [pathGatewayPattern,
                   ipfsAddressPattern,
                   pathPattern,
                   subdomainGatewayPattern]) {
    match = formatted.match(pattern)
    if (match)
      break
  }
  if (!match)
    return false

  let protocolMatch = 1
  let hashMatch = 2
  if (pattern === subdomainGatewayPattern) {
    protocolMatch = 2
    hashMatch = 1
  }

  if (match[protocolMatch] !== 'ipfs')
    return false

  let hash = match[hashMatch]

  if (hash && pattern === subdomainGatewayPattern)
    hash = hash.toLowerCase()

  if (isCID(hash))
    return {hash, match, pattern}

  return false
}

/**
 * @param {string} cid CID you want to retrieve
 * @param {string} mime mimetype of image (optional, but useful)
 * @param {number} limit size limit of image in bytes
 * @returns ObjectURL
 */
export async function objectURL(ipfs: any, cid: string, mime:string = 'image/jpeg') {
  if (!ipfs || !cid)
    return false

    let content = []
    for await (const chunk of ipfs.cat(cid))
      content.push(chunk)

    if (!content)
      return false

    const blob = new Blob(content, { type: mime })
    const objURL = URL.createObjectURL(blob)
    return {blob, objURL}
}

export async function fetchAndParse(ipfs: any, ipfsHost: string, cid: string, useCache: boolean = true) {
  if (!cid)
    return false

  let data = '' as any
  let json = {}

  if (useCache)
    data = localStorage.getItem(cid)
  if (data) {
    if (ipfs)
      ipfs.add(data)
    return JSON.parse(data)
  }

  let tries = 0
  let response = null as any

  const paths = [
    `${ipfsHost}${cid}`,
    `https://cf-ipfs.com${cid}`,
    `https://ipfs.io${cid}`,
    `https://infura-ipfs.io${cid}`,
    `https://gateway.pinata.cloud${cid}`,
    `https://thingproxy.freeboard.io/fetch/https://ipfsgateway.makersplace.com${cid}`,
  ]

  for (let i = 0; i < paths.length; i++) {
    try {
      if (i > 0)
        console.log(`Trying ${paths[i]}...`)
      response = await fetchWithTimeout(paths[i])
      data = await response.text()
    } catch (error: any) {
      console.log(`Timed out fetching metadata from ${paths[i]}`)
      if (i === paths.length - 1)
        tries += 1
      if (tries > 3) {
        console.warn(`Gave up fetching metadata for ${cid}`)
        break
      }
      continue
    }
    break
  }

  if (!data)
    return false

  if (data && useCache)
    localStorage.setItem(cid, data)

  if (ipfs)
    ipfs.add(data)

  json = JSON.parse(data)

  if (json)
    return json

  return false
}

export async function fetchWithTimeout(uri: string, options:any = {}) {
  const { timeout = 8000 } = options

  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  const response = await fetch(uri, {
    ...options,
    signal: controller.signal
  })
  clearTimeout(id)

  return response
}
