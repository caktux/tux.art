
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'
import { useIPFS } from '../hooks/ipfs'
import { useParams } from 'react-router-dom'

import Container from 'react-bootstrap/Container'
import Alert from 'react-bootstrap/Alert'
import Image from 'react-bootstrap/Image'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'

import { MintForm } from '../components/MintForm'

import { getTokenContract } from '../fetchers/contracts'


export default function Mint(props: any) {
  const { ipfs, ipfsHost } = useIPFS()
  const { provider } = useEthereum()

  const params = useParams<any>()

  const [ delay, setDelay ] = useState(500)
  const [ error, setError ] = useState(false as any)
  const [ imageHash, setImageHash ] = useState('')
  const [ mediaHash, setMediaHash ] = useState('')
  // const [ uploadedImage, setUploadedImage ] = useState('')
  // const [ uploadedMedia, setUploadedMedia ] = useState('')
  const [ imageUploadProgress, setImageUploadProgress ] = useState(0)
  const [ mediaUploadProgress, setMediaUploadProgress ] = useState(0)
  const [ checkedSize, setCheckedSize ] = useState(false)

  const [ address, setAddress ] = useState('')
  const [ fetched, setFetched ] = useState(false)
  const [ contract, setContract ] = useState({name: '', tokenContract: ''})

  const previewImage = useRef(null as any)


  const setImageCheckLoaded = (e: any) => {
    if (!checkedSize && previewImage) {
      if (previewImage.current.naturalHeight > 1080 || previewImage.current.naturalWidth > 1080) {
        setError('Please keep the preview image dimensions below 1080x1080')
        setImageHash('')
        setTimeout(() => {
          setImageUploadProgress(0)
        }, 500)
        return
      }
      setCheckedSize(true)
    }
    if (previewImage) {
      setTimeout(() => {
        setDelay(delay => (delay + 250))
        setImageUploadProgress(imageUploadProgress => (imageUploadProgress + (ipfs ? 14.29 : 20)))
      }, delay)
    }
  }

  const setImageLoaded = (e: any) => {
    setTimeout(() => {
      setDelay(delay => (delay + 250))
      setImageUploadProgress(imageUploadProgress => (imageUploadProgress + (ipfs ? 14.29 : 20)))
    }, delay)
  }

  const setMediaLoaded = (e: any) => {
    setTimeout(() => {
      setDelay(delay => (delay + 250))
      setMediaUploadProgress(mediaUploadProgress => (mediaUploadProgress + (ipfs ? 14.29 : 20)))
    }, delay)
  }

  const refresh = (newAddress: string) => {
    setAddress(newAddress)
  }

  useEffect(() => {
    if (params && params.address && params.address !== address)
      refresh(params.address)
  })

  useEffect(() => {
    const fetchContract = async () => {
      if (fetched || !address)
        return
      setFetched(true)
      const fetchedContract = await getTokenContract(provider, address)
      setContract(fetchedContract)
    }
    fetchContract()
  })

  return (
    <Container>
      <Row>
        <Col>
          <h3 className='my-5'>
            Mint{ contract.name ? ` to ${contract.name}` : '' }
          </h3>
        </Col>
      </Row>
      <Row className='mb-3'>
        <Col lg='10' xl='8'>
          { error &&
            <Alert variant='danger' onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          }
          <MintForm
            address={address ? address : ''}
            setError={setError}
            imageHash={imageHash}
            mediaHash={mediaHash}
            setImageHash={setImageHash}
            setMediaHash={setMediaHash}
            imageUploadProgress={imageUploadProgress}
            setImageUploadProgress={setImageUploadProgress}
            mediaUploadProgress={mediaUploadProgress}
            setMediaUploadProgress={setMediaUploadProgress}
          />
        </Col>
        <Col lg='2' xl='4'>
          { imageHash &&
            <>
              <Row className='mb-2'>
                <Col>
                  Preview
                </Col>
              </Row>
              <Row className='mb-2'>
                <Col lg='12' xl='6' className='mb-2'>
                  <div className='mb-1'>local</div>
                  { ipfs ?
                    <a href={`${ipfsHost}/ipfs/${imageHash}`} target='_blank' rel="noreferrer">
                      <Image src={`${ipfsHost}/ipfs/${imageHash}`} onLoad={setImageLoaded} thumbnail />
                    </a> :
                    <Alert variant='info' className='text-center'>Local IPFS disabled</Alert> }
                </Col>
                <Col lg='12' xl='6' className='mb-2'>
                  <div className='mb-1'>dweb.link</div>
                  <a href={`https://dweb.link/ipfs/${imageHash}`} target='_blank' rel="noreferrer">
                    <Image ref={previewImage} src={`https://dweb.link/ipfs/${imageHash}`} onLoad={setImageCheckLoaded} thumbnail />
                  </a>
                </Col>
              </Row>
              <Row className='mb-3'>
                <Col lg='12' xl='6' className='mb-2'>
                  <div className='mb-1'>infura-ipfs.io</div>
                  <a href={`https://ipfs.infura.io/ipfs/${imageHash}`} target='_blank' rel="noreferrer">
                    <Image src={`https://ipfs.infura.io/ipfs/${imageHash}`} onLoad={setImageLoaded} thumbnail />
                  </a>
                </Col>
                <Col lg='12' xl='6' className='mb-2'>
                  <div className='mb-1'>cloudflare</div>
                  <a href={`https://cf-ipfs.com/ipfs/${imageHash}`} target='_blank' rel="noreferrer">
                    <Image src={`https://cf-ipfs.com/ipfs/${imageHash}`} onLoad={setImageLoaded} thumbnail />
                  </a>
                </Col>
              </Row>
            </>
          }
          { mediaHash &&
            <>
              <Row className='mt-4 mb-2'>
                <Col>
                  Media
                </Col>
              </Row>
              <Row className='mb-2'>
                <Col lg='12' xl='6' className='mb-2'>
                  <div className='mb-1'>local</div>
                  { ipfs ?
                    <a href={`${ipfsHost}/ipfs/${mediaHash}`} target='_blank' rel="noreferrer">
                      <Image src={`${ipfsHost}/ipfs/${mediaHash}`} onLoad={setMediaLoaded} thumbnail />
                    </a> :
                    <Alert variant='info'>Local IPFS disabled</Alert> }
                </Col>
                <Col lg='12' xl='6' className='mb-2'>
                  <div className='mb-1'>dweb.link</div>
                  <a href={`https://dweb.link/ipfs/${mediaHash}`} target='_blank' rel="noreferrer">
                    <Image src={`https://dweb.link/ipfs/${mediaHash}`} onLoad={setMediaLoaded} thumbnail />
                  </a>
                </Col>
              </Row>
              <Row className='mb-3'>
                <Col lg='12' xl='6' className='mb-2'>
                  <div className='mb-1'>infura-ipfs.io</div>
                  <a href={`https://infura-ipfs.io/ipfs/${mediaHash}`} target='_blank' rel="noreferrer">
                    <Image src={`https://infura-ipfs.io/ipfs/${mediaHash}`} onLoad={setMediaLoaded} thumbnail />
                  </a>
                </Col>
                <Col lg='12' xl='6' className='mb-2'>
                  <div className='mb-1'>cloudflare</div>
                  <a href={`https://cf-ipfs.com/ipfs/${mediaHash}`} target='_blank' rel="noreferrer">
                    <Image src={`https://cf-ipfs.com/ipfs/${mediaHash}`} onLoad={setMediaLoaded} thumbnail />
                  </a>
                </Col>
              </Row>
            </>
          }
        </Col>
      </Row>
    </Container>
  )
}
