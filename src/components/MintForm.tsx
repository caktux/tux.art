
import { useState } from 'react'
import { useWallet } from 'use-wallet'
import { useIPFS } from '../hooks/ipfs'

import { Link } from 'react-router-dom'

import ProgressBar from 'react-bootstrap/ProgressBar'
import Container from 'react-bootstrap/Container'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'

import { ethers, Signer } from 'ethers'
import { ERC721 } from '../abi/ERC721'
import { TUX } from '../constants/contracts'
import { NFTSTORAGE_KEY, pinToPinata } from '../utils/nfts'

import { NFTStorage, File } from 'nft.storage'
import { create, Options } from 'ipfs-http-client'


export const MintForm = (props: any) => {
  const { ipfs } = useIPFS()
  const { ethereum } = useWallet()

  const [ name, setName ] = useState('')
  const [ description, setDescription ] = useState('')
  const [ validated, setValidated ] = useState(false)
  // const [ localPinning, setLocalPinning ] = useState(true)
  const [ imagePinned, setImagePinned ] = useState('')
  const [ imagePinnedInfura, setImagePinnedInfura ] = useState('')
  // const [ imagePinnedPinata, setImagePinnedPinata ] = useState('')
  const [ mediaPinned, setMediaPinned ] = useState('')
  const [ mediaPinnedInfura, setMediaPinnedInfura ] = useState('')
  // const [ mediaPinnedPinata, setMediaPinnedPinata ] = useState('')
  const [ capturingImage, setCapturingImage ] = useState(false)
  const [ capturingMedia, setCapturingMedia ] = useState(false)
  const [ imageType, setImageType ] = useState('image/jpeg')
  const [ mediaType, setMediaType ] = useState('image/jpeg')
  // const [ metadataPinned, setMetadataPinned ] = useState('')
  // const [ metadataPinnedInfura, setMetadataPinnedInfura ] = useState('')
  // const [ metadataPinnedPinata, setMetadataPinnedPinata ] = useState('')
  const [ metadataHash, setMetadataHash ] = useState('')
  const [ pending, setPending ] = useState(false)
  const [ txResult, setTxResult ] = useState('' as any)
  const [ success, setSuccess ] = useState('' as any)

  const nftstorage = new NFTStorage({ token: NFTSTORAGE_KEY })
  const infura = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https'
  } as Options)


  const sendToIPFS = async ([file]:any, kind: string) => {
    try {
      if (!file) {
        props.setError('Please choose a file')
        kind === 'image' ? setCapturingImage(false) : setCapturingMedia(false)
        return
      }

      if (kind === 'image' && file.type.slice(0, 5) !== 'image') {
        props.setError('Preview is not a valid image')
        return
      }

      kind === 'image' ? setImageType(file.type) : setMediaType(file.type)

      let localCid = ''
      let progress = 0

      if (ipfs) {
        const { cid } = await ipfs.add(file, { cidVersion: 1 })
        localCid = cid.toString()

        progress = 14.29

        kind === 'image' ? props.setImageUploadProgress(progress) : props.setMediaUploadProgress(progress)

        console.log(`Pinned on local node: ${cid}`)

        // let bufs:Array<Buffer> = []
        // for await (const chunk of ipfs.cat(cid))
        //   bufs.push(new Buffer(chunk))
        // const data = Buffer.concat(bufs)
        // const blob = new Blob( [data], { type: kind === 'image' ? imageType : mediaType } )
        // const src = URL.createObjectURL(blob)
        //
        // kind === 'image' ? props.setUploadedImage(src) : props.setUploadedMedia(src)
      }


      const nftCid = await nftstorage.storeBlob(new File([file], '', { type: kind === 'image' ? imageType : mediaType }))

      kind === 'image' ?
        setImagePinned(nftCid ? 'success' : 'danger') :
        setMediaPinned(nftCid ? 'success' : 'danger')

      if (!nftCid)
        throw Error('Error pinning on nft.storage, please try again later')

      const status = await nftstorage.check(nftCid)

      progress += ipfs ? 14.29 : 20

      kind === 'image' ? props.setImageUploadProgress(progress) : props.setMediaUploadProgress(progress)

      console.log('Pinned on nft.storage', status)


      const { cid } = await infura.add(
        file,
        { cidVersion: 1,
          progress: (prog: any) => kind === 'image' ?
            props.setImageUploadProgress(progress + ((prog / file.size) * 100) / (ipfs ? 7 : 5)) :
            props.setMediaUploadProgress(progress + ((prog / file.size) * 100) / (ipfs ? 7 : 5))
        }
      )
      kind === 'image' ?
        setImagePinnedInfura(cid ? 'success' : 'warning') :
        setMediaPinnedInfura(cid ? 'success' : 'warning')
      console.log(`Pinned on Infura: ${cid}`)


      // const resp = await pinToPinata(nftCid)
      // if (resp)
      //   console.log('Pinned on Pinata', resp)
      // kind === 'image' ?
      //   setImagePinnedPinata(resp ? 'success' : 'warning') :
      //   setMediaPinnedPinata(resp ? 'success' : 'warning')


      if (cid.toString() !== nftCid || (localCid && localCid !== nftCid))
        throw Error('Pinned CIDs do not match')

      kind === 'image' ? props.setImageHash(nftCid) : props.setMediaHash(nftCid)

    } catch (e: any) {
      console.error(e.message)
      props.setError(e.message)
    }

    if (kind === 'image')
      setCapturingImage(false)
    else
      setCapturingMedia(false)
  }

  const mintNFT = async () => {
    setPending(true)

    if (!name) {
      props.setError('Missing title')
      return
    }

    try {
      const metadataJSON = JSON.stringify({
        name: name,
        description: description,
        image: `ipfs://${props.imageHash}`,
        media: `ipfs://${props.mediaHash}`,
        imageMimeType: imageType,
        mediaMimeType: mediaType
      })

      let localCid = ''
      if (ipfs) {
        const { cid } = await ipfs.add(metadataJSON, {
          cidVersion: 1
        })
        localCid = cid.toString()
        console.log(`Pinned metadata on local node: ${cid}`)
      }

      const metadataCid = await nftstorage.storeBlob(new Blob([metadataJSON], { type: 'application/json' }))

      const status = await nftstorage.check(metadataCid)

      console.log('Pinned metadata on nft.storage', status)
      // setMetadataPinned(status ? 'success' : 'danger')


      const { cid } = await infura.add(new Blob([metadataJSON], { type: 'application/json' }), { cidVersion: 1 })
      console.log(`Pinned metadata on Infura: ${cid}`)
      // setMetadataPinnedInfura(cid ? 'success' : 'warning')


      const resp = await pinToPinata(metadataCid)
      if (resp)
        console.log('Pinned metadata on Pinata', resp)
      // setMetadataPinnedPinata(resp ? 'success' : 'warning')


      if (cid.toString() !== metadataCid || (localCid && localCid !== metadataCid))
        throw Error('Pinned metadata CIDs do not match')

      setMetadataHash(metadataCid)


      const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
      const contract = new ethers.Contract(props.address ? props.address : TUX, ERC721, signer as Signer)

      const gasEstimate = await contract.estimateGas.mint(metadataCid)
      const paddedEstimate = gasEstimate.mul(105).div(100)

      const tx = await contract.mint(metadataCid, { gasLimit: paddedEstimate.toString() }).catch((e: any) => {
        console.warn(`In contract.mint`, e.error ? e.error.message : e.message)
        if (e.error && e.error.message)
          props.setError(e.error.message.replace('execution reverted: ', ''))
        else
          props.setError(e.message)
      })

      if (tx && tx.hash) {
        props.setError(false)
        setTxResult(tx.hash)
        const receipt = await tx.wait()
        const txLog = contract.interface.parseLog(receipt.events[0])
        setSuccess(txLog.args.tokenId.toString())
      }

      setPending(false)

    } catch(e: any) {
      console.warn(`Minting`, e.error ? e.error.message : e.message)
      if (e.error && e.error.message)
        props.setError(e.error.message.replace('execution reverted: ', ''))
      else
        props.setError(e.message)
    }
  }

  const captureImage = (event: any) => {
    event.stopPropagation()
    event.preventDefault()
    setCapturingImage(true)
    sendToIPFS(
      event.target.form[0].files,
      'image'
    )
  }

  const captureMedia = (event: any) => {
    event.stopPropagation()
    event.preventDefault()
    setCapturingMedia(true)
    sendToIPFS(
      event.target.form[0].files,
      'media'
    )
  }

  const handleChange = (event: any) => {
    if (event.currentTarget.checkValidity() === false) {
      event.preventDefault()
      event.stopPropagation()
      setValidated(false)
    } else {
      props.setError(false)
      setValidated(true)
    }
  }

  const handleChangeName = (event: any) => {
    setName(event.currentTarget.value)
  }

  const handleChangeDescription = (event: any) => {
    setDescription(event.currentTarget.value)
  }

  // const handleChangePinning = (event: any) => {
  //   setLocalPinning(event.currentTarget.checked)
  // }

  const handleSubmit = (event: any) => {
    const form = event.currentTarget;
    event.preventDefault()
    event.stopPropagation()
    if (form.checkValidity() === false) {
      setValidated(false)
    } else {
      setValidated(true)
      mintNFT()
    }
  }


  return (
    <>
      { pending &&
        <Container className='text-center mb-3'>
          <Spinner animation='grow' role='status' />
        </Container>
      }
      { !pending && !txResult &&
        <>
          <Row xs={1} xl={2} className='mb-3'>
            <Col>
              { (capturingImage || props.imageHash) &&
                <Row className='text-center mt-3'>
                  <Col className='text-center'>
                    <Container className='mt-2'>
                        <Button variant={imagePinned || 'secondary'} size='sm' disabled>
                          ✓
                        </Button> nft.storage
                    </Container>
                  </Col>
                  <Col className='text-center'>
                    <Container className='mt-2'>
                      <Button variant={imagePinnedInfura || 'secondary'} size='sm' disabled>
                        ✓
                      </Button> infura
                    </Container>
                  </Col>
                  {
                  // <Col className='text-center'>
                  //   <Container className='mt-2'>
                  //     <Button variant={imagePinnedPinata || 'secondary'} size='sm' disabled>
                  //       ✓
                  //     </Button> pinata
                  //   </Container>
                  // </Col>
                  }
                  <Container className='mt-3'>
                    <Button variant={props.imageUploadProgress >= 100 ? 'success' : 'secondary'} size='lg' disabled>
                      { props.imageUploadProgress < 100 ?
                        <Spinner size='sm' animation='grow' role='status' /> :
                        '✓' }
                    </Button>
                  </Container>
                </Row> }
              <Row className='mt-3'>
                { !capturingImage && !props.imageHash &&
                  <Form className='fill-height'>
                    <Row className='mb-3'>
                      <Form.Group controlId='formImage'>
                        <Form.Label>Select the preview image</Form.Label>
                        <Form.Control type='file' />
                      </Form.Group>
                    </Row>
                    <div className='d-grid gap-2'>
                      <Button type='submit' disabled={capturingImage || props.imageHash} onClick={captureImage}>
                        { capturingImage ?
                          <Spinner size='sm' animation='grow' role='status' /> :
                          'Upload to IPFS' }
                      </Button>
                    </div>
                  </Form>
                }
              </Row>
            </Col>

            <Col>
              { (capturingMedia || props.mediaHash) &&
                <Row className='text-center mt-3'>
                  <Col className='text-center'>
                    <Container className='mt-2'>
                        <Button variant={mediaPinned || 'secondary'} size='sm' disabled>
                          ✓
                        </Button> nft.storage
                    </Container>
                  </Col>
                  <Col className='text-center'>
                    <Container className='mt-2'>
                      <Button variant={mediaPinnedInfura || 'secondary'} size='sm' disabled>
                        ✓
                      </Button> infura
                    </Container>
                  </Col>
                  {
                  // <Col className='text-center'>
                  //   <Container className='mt-2'>
                  //     <Button variant={mediaPinnedPinata || 'secondary'} size='sm' disabled>
                  //       ✓
                  //     </Button> pinata
                  //   </Container>
                  // </Col>
                  }
                  <Container className='mt-3'>
                    <Button variant={props.mediaUploadProgress >= 100 ? 'success' : 'secondary'} size='lg' disabled>
                      { props.mediaUploadProgress < 100 ?
                        <Spinner size='sm' animation='grow' role='status' /> :
                        '✓' }
                    </Button>
                  </Container>
                </Row> }
              <Row className='mt-3'>
                { !capturingMedia && !props.mediaHash &&
                  <Form className='fill-height'>
                    <Row className='mb-3'>
                      <Form.Group controlId='formMedia'>
                        <Form.Label>Select the full resolution image or media file</Form.Label>
                        <Form.Control type='file' />
                      </Form.Group>
                    </Row>
                    <div className='d-grid gap-2'>
                      <Button type='submit' disabled={capturingMedia || props.mediaHash} onClick={captureMedia}>
                        { capturingMedia ?
                          <Spinner size='sm' animation='grow' role='status' /> :
                          'Upload to IPFS' }
                      </Button>
                    </div>
                  </Form>
                }
              </Row>
            </Col>
          </Row>
          <Row className='mb-4'>
            <Col>
              <ProgressBar now={props.imageUploadProgress} />
            </Col>
            <Col>
              <ProgressBar now={props.mediaUploadProgress} />
            </Col>
          </Row>

          <Form noValidate validated={validated} onSubmit={handleSubmit} onChange={handleChange} className='mb-3'>
            {
            // <Row className='mb-3'>
            //   <Form.Group as={Col} controlId="validationLocalPinning">
            //     <Form.Check
            //       value={'checked'}
            //       label='Pin to local IPFS node'
            //       onChange={handleChangePinning}
            //       defaultChecked />
            //     <Form.Text id="localPinningHelp" muted>
            //       If a local IPFS node is detected, pin the image, media and metadata files.
            //     </Form.Text>
            //   </Form.Group>
            // </Row>
            }
            <Row className='mb-3'>
              <Form.Group as={Col} controlId="validationTitle">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  required
                  type="text"
                  placeholder="Title"
                  onChange={handleChangeName}
                />
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                <Form.Control.Feedback type="invalid">
                  Please enter a title.
                </Form.Control.Feedback>
              </Form.Group>
            </Row>
            <Row className='mb-3'>
              <Form.Group as={Col} controlId="validationDescription">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  type="text"
                  as="textarea"
                  style={{ height: '7rem' }}
                  placeholder="Description"
                  onChange={handleChangeDescription}
                />
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                <Form.Control.Feedback type="invalid">
                  Please enter a description.
                </Form.Control.Feedback>
              </Form.Group>
            </Row>
            <Row className='mb-3'>
              <Container>
                <div className='d-grid gap-2'>
                  <Button variant='success' type='submit' disabled={!ethereum || !props.imageHash || !props.mediaHash || !validated}>
                    Mint
                  </Button>
                </div>
              </Container>
              { props.address &&
                <Form.Text className='mt-3' muted>
                  Minting on{' '}
                  <Link to={`/contract/${ props.address }`} className='text-muted'>
                    { props.address }
                  </Link>
                </Form.Text>
              }
            </Row>
          </Form>
        </>
      }
      { success &&
        <Alert variant='success' onClose={() => setSuccess('')} dismissible>
          Successfully minted{' '}
          <Link to={`/nft/${ props.address ? props.address : TUX }/${success}`}>
            token #{success}
          </Link>!
        </Alert>
      }
      { txResult &&
        <Alert variant='primary' onClose={() => setTxResult('')} dismissible>
          <Alert.Heading>Transaction sent!</Alert.Heading>
          <p>
            View on Etherscan:{' '}
            <Alert.Link href={`https://etherscan.io/tx/${txResult}`} as={'a'} target='blank'>
              {txResult}
            </Alert.Link>
          </p>
        </Alert>
      }
      { metadataHash &&
        <Alert variant='primary'>
          <p>
            Metadata IPFS hash: <code className='imageHash'>{metadataHash}</code>
          </p>
          <a target='_blank' rel='noreferrer' href={'ipfs://' + metadataHash}>
            {'ipfs://' + metadataHash}
          </a>
        </Alert>
      }
      { props.imageHash &&
        <Alert variant='primary'>
          <p>
            Preview image IPFS hash: <code className='imageHash'>{props.imageHash}</code>
          </p>
          <a target='_blank' rel='noreferrer' href={'ipfs://' + props.imageHash}>
            {'ipfs://' + props.imageHash}
          </a>
        </Alert>
      }
      { props.mediaHash &&
        <Alert variant='primary'>
          <p>
            Media IPFS hash: <code className='imageHash'>{props.mediaHash}</code>
          </p>
          <a target='_blank' rel='noreferrer' href={'ipfs://' + props.mediaHash}>
            {'ipfs://' + props.mediaHash}
          </a>
        </Alert>
      }
    </>
  )
}
