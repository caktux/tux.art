
import { ethers } from 'ethers'
import { ERC721 } from '../abi/ERC721'
import { KnownOrigin } from '../abi/KnownOrigin'
import { MakersPlace } from '../abi/MakersPlace'
import { getIpfsHash, fetchAndParse } from '../utils/ipfs'
import { lookup } from 'mime-types'


export const loadToken = async (token: any, ipfsHost: string, isPreview: boolean = false) => {
  const hash = getIpfsHash(isPreview && token.props.previewUri ?
                           token.props.previewUri :
                           token.props.uri)

  if (!hash) { // Pretty much just MakersPlace and OpenSea...
    token.props.src = token.props.previewUri && isPreview ?
                      token.props.previewUri :
                      token.props.uri
    return token
  }

  const resolvedHash = (hash.match && hash.match[3]) ?
                       `/ipfs/${hash.hash}/${hash.match[3]}` :
                       `/ipfs/${hash.hash}`

  token.props.src = `${ipfsHost}${resolvedHash}`

  return token
}


const tokenURI = (token: any) => {
  let uri = ''

  if (token.metadata.media &&
      typeof token.metadata.media === 'string') // Tux & Zora
    uri = token.metadata.media
  else if (token.metadata.media &&
           typeof token.metadata.media === 'object' &&
           token.metadata.media.uri) // SuperRare
    uri = token.metadata.media.uri
  else if (token.metadata.image) // Most ERC721
    uri = token.metadata.image
  else if (token.metadata.uri) // Rarible
    uri = token.metadata.uri
  else if (token.metadata.imageUrl) // MakersPlace
    uri = token.metadata.imageUrl
  // console.log(uri)

  return uri
}


const tokenPreviewURI = (token: any) => {
  let previewUri = ''
  if (token.metadata.media && token.metadata.image) // Tux, Zora & SuperRare
    previewUri = token.metadata.image
  else if (token.metadata.previewUri)
    previewUri = token.metadata.previewUri
  else if (token.metadata.properties &&
           token.metadata.properties.preview_media_file) // MakersPlace
    previewUri = token.metadata.properties.preview_media_file.description

  return previewUri
}


const tokenToProps = async (token: any, provider: any) => {
  // console.log(token) // This is getting messy...

  const uri = tokenURI(token)

  const previewUri = tokenPreviewURI(token)

  let creator = token.props.creator || token.metadata.creator || token.metadata.artist || token.metadata.minter

  let createdBy = ''
  if (token.metadata.attributes && token.metadata.attributes.length > 0) { // MakersPlace...
    if (token.metadata.attributes[0].trait_type === 'Creator')
      createdBy = token.metadata.attributes[0].value
  }

  let ext = uri.split('.') as any
  if (ext)
    ext = ext.pop().toLowerCase() || ''
  // const previewExt = previewUri.split('.').pop() || ''

  let mimeType = lookup(uri)
  let previewMimeType = lookup(previewUri) || (previewUri.endsWith('thumbnail') && 'image/jpeg')

  mimeType = token.metadata.mediaMimeType || token.metadata.mimeType || mimeType || 'image/jpeg'
  previewMimeType = token.metadata.imageMimeType || previewMimeType || mimeType

  let name = token.metadata.name
  let description = token.metadata.description

  if (token.metadata.body) { // Zora's audio files...
    if (token.metadata.body.mimeType) {
      mimeType = token.metadata.body.mimeType
      previewMimeType = mimeType
    }
    if (token.metadata.body.title)
      name = token.metadata.body.title
    if (token.metadata.body.notes)
      description = token.metadata.body.notes
  }

  token.props = {
    src: '',
    uri: uri,
    previewUri: previewUri,
    owner: token.props.owner,
    creator: creator,
    loaded: false,
    mimeType: mimeType,
    isImage: mimeType && mimeType.slice(0, 5) === 'image',
    isImagePreview: previewMimeType && previewMimeType.slice(0, 5) === 'image',
    isAudio: mimeType && mimeType.slice(0, 5) === 'audio',
    isAudioPreview: previewMimeType && previewMimeType.slice(0, 5) === 'audio',
    isVideo: mimeType && mimeType.slice(0, 5) === 'video',
    isVideoPreview: previewMimeType && previewMimeType.slice(0, 5) === 'video',
    isText: mimeType && mimeType.slice(0, 4) === 'text',
    is3D: ['gltf', 'glb'].includes(ext),
    title: name,
    description: description,
    createdBy: createdBy ? `Created by ${createdBy}` : '',
    // ownedBy: ownedBy
  }

  return token
}


export async function fetchMetadata(provider: any, ipfs: any, ipfsHost: string, props: any, params?: any) {
  const address = (params && params.contract) ? params.contract.toLowerCase() : props.address.toLowerCase()
  const tokenId = (params && params.tokenId) ? params.tokenId : props.tokenId

  if (!address || !tokenId)
    return null

  let contract = new ethers.Contract(address, ERC721, provider)

  let tokenURI = ''
  let mediaURI = '' // Zora...

  switch (address) {
    case '0xabefbc9fd2f806065b4f3c237d4b59d9a97bcac7': // Zora...
      tokenURI = await contract.tokenMetadataURI(tokenId).catch((e: any) => {
        console.warn('From contract.contentURI', e.message)
      })
      mediaURI = await contract.tokenURI(tokenId).catch((e: any) => {
        console.warn('From Zora\'s contract.tokenURI', e.message)
      })
      break

    case '0x495f947276749ce646f68ac8c248420045cb7b5e': // OpenSea...
      tokenURI = await contract.uri(tokenId).catch((e: any) => {
        console.warn('From contract.uri', e.message)
      })
      tokenURI = tokenURI.replace('0x{id}', tokenId) + '?format=json' // sketchy af...
      break

    default: // Most ERC721 contracts
      tokenURI = await contract.tokenURI(tokenId).catch((e: any) => {
        console.warn('From contract.tokenURI', e.message)
      })
      break
  }

  // console.log(tokenURI)

  let hash = '' as any
  let parsedToken = null as any

  if (address === '0x495f947276749ce646f68ac8c248420045cb7b5e') { // Fucking OpenSea...
    parsedToken = await (await fetch(`${tokenURI}`)).json()
    parsedToken.previewUri = parsedToken.image
    parsedToken.image = parsedToken.image + '=s0'
  }
  else {
    hash = getIpfsHash(tokenURI)

    if (!hash)
      return null

    let resolvedHash = `/ipfs/${hash.hash}`
    if (hash.match && hash.match[3])
      resolvedHash = `/ipfs/${hash.hash}/${hash.match[3]}`

    parsedToken = await fetchAndParse(ipfs, ipfsHost, resolvedHash).catch((e: any) => {
      console.warn('From fetchAndParse', resolvedHash, e.message)
      localStorage.removeItem(resolvedHash)
    })
  }

  if (!parsedToken)
    return null

  // console.log(parsedToken)

  let creator = parsedToken.creator || parsedToken.artist || parsedToken.minter || ''

  if (!creator) {
    switch (address) {
      case '0x60f80121c31a0d46b5279700f9df786054aa5ee5': // Skip Rarible
      case '0x495f947276749ce646f68ac8c248420045cb7b5e': // and OpenSea
        break

      case '0xfbeef911dc5821886e1dda71586d90ed28174b7d': // KnownOrigin...
        contract = new ethers.Contract(address, KnownOrigin, provider)
        const editionId = await contract.editionOfTokenId(tokenId).catch((e: any) => {
          console.warn('From contract.editionOfTokenId', e.message)
        })
        if (editionId) {
          const edition = await contract.detailsOfEdition(editionId).catch((e: any) => {
            console.warn('From contract.detailsOfEdition', e.message)
          })
          if (edition && edition.length > 4)
            creator = edition[4]
        }
        break

      case '0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756': // MakersPlace...
      case '0x2d9e5de7d36f3830c010a28b29b3bdf5ca73198e':
        contract = new ethers.Contract(address, MakersPlace, provider)
        const releaseId = await contract.tokenIdToDigitalMediaRelease(tokenId).catch((e: any) => {
          console.warn('From contract.tokenIdToDigitalMediaRelease', e.message)
        })
        // console.log(releaseId)
        if (releaseId) {
          const release = await contract.getDigitalMediaRelease(releaseId[0]).catch((e: any) => {
            console.warn('From contract.getDigitalMediaRelease', e.message)
          })
          // console.log(release)
          if (release && release.length > 2) {
            const media = await contract.getDigitalMedia(release[2]).catch((e: any) => {
              console.warn('From contract.getDigitalMedia', e.message)
            })
            if (media && media.length > 4 && media[3] > 0) {
              const collection = await contract.getCollection(media[3]).catch((e: any) => {
                console.warn('From contract.getCollection', e.message)
                // if (media && media.length > 4 && media[4])
                //   creator = media[4]
              })
              if (collection && collection.length > 2 && collection[1])
                creator = collection[1]
            }
          }
        }
        break

      case '0xfe21b0a8df3308c61cb13df57ae5962c567a668a': // Ephimera... this is so brittle
        const account = parsedToken.external_uri.slice(parsedToken.external_uri.length - 42)
        if (ethers.utils.isAddress(account))
          creator = account
        break

      case '0xabefbc9fd2f806065b4f3c237d4b59d9a97bcac7': // Zora...
        creator = await contract.tokenCreators(tokenId).catch((e: any) => {
          console.warn('From contract.tokenCreators', e.message)
        })
        break

      default: // Good citizens
        creator = await contract.tokenCreator(tokenId).catch((e: any) => {
          console.warn('From contract.tokenCreator', e.message)
        })
        break
    }
  }

  if (mediaURI) // Zora...
    parsedToken.media = mediaURI

  let owner = ''
  if (address !== '0x495f947276749ce646f68ac8c248420045cb7b5e') // No ownerOf on OpenSea...
    owner = await contract.ownerOf(tokenId).catch((e: any) => {
      console.warn('From contract.ownerOf', e.message)
    })

  let token = {
    id: tokenId,
    address: address,
    onIPFS: hash !== '',
    metadata: parsedToken,
    props: {
      owner: owner,
      creator: creator,
      uri: tokenURI,
      src: '',
      title: '',
      description: ''
    }
  }

  token = await tokenToProps(token, provider)

  return token
}
