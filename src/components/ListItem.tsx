
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'
import { useIPFS } from '../hooks/ipfs'
import { useWallet } from 'use-wallet'

import { Link } from 'react-router-dom'

import Placeholder from 'react-bootstrap/Placeholder'
import Container from 'react-bootstrap/Container'
import Spinner from 'react-bootstrap/Spinner'
import Alert from 'react-bootstrap/Alert'
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'

import Address from './Address'
import { LazyImg } from './LazyImg'

import { fetchMetadata, loadToken } from '../fetchers/metadata'
import { emptyToken } from '../utils/nfts'


export default function ListItem(props: any) {
  const { ipfs, ipfsHost } = useIPFS()
  const { provider } = useEthereum()
  const { account } = useWallet()

  const [ error, setError ] = useState(false)
  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ focused, setFocused ] = useState('')
  const [ token, setToken ] = useState(emptyToken as any)

  const mounted = useRef(true)

  const updateToken = (token: any) => {
    if (!mounted.current)
      return
    setToken(token)
  }

  useEffect(() => {
    const fetchToken = async () => {
      if (!props.loaded && mounted.current) {
        setError(false)
        setLoaded(false)
        setFetched(false)
        updateToken(emptyToken)
        return
      }
      if (!provider || !props.tokenId || fetched || loaded || !mounted.current)
        return

      setFetched(true)

      const fetchedToken = await fetchMetadata(provider, ipfs, ipfsHost, props)

      if (!mounted.current)
        return

      if (!fetchedToken) {
        console.warn(`Whoopsied on ${props.tokenId}`)
        if (props.setFailed)
          props.setFailed()
        setLoaded(true)
        setError(true)
        return
      }

      updateToken(fetchedToken)

      const loadedToken = await loadToken(fetchedToken, ipfsHost, true)

      updateToken(loadedToken)

      if (!mounted.current)
        return

      setLoaded(true)
    }
    fetchToken()
  })

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <Col className='mb-3'>
      <Card className='previewCard'
            onTouchStart={(e) => { setFocused(!focused ? 'focused' : '') }}
            onTouchEnd={(e) => { setFocused(!focused ? 'focused' : '') }}>
        <div className={`previewImage grow ${focused}`}>
        { !error && token.props.src ? (
            token.props.isImagePreview ?
            <>
              <Link to={ `/nft/${props.address}/${props.tokenId}` }>
                <LazyImg
                  className='card-img-top'
                  src={token.props.src}
                  alt={token.props.title}
                  isOwner={account === token.props.owner} />
              </Link>
              <Link to={ `/nft/${props.address}/${props.tokenId}` }>
                <LazyImg
                  className='full'
                  src={token.props.src}
                  alt={token.props.title}
                  isOwner={account === token.props.owner} />
              </Link>
            </> :
            token.props.isVideoPreview ?
            <video autoPlay loop controls muted>
              <source src={ token.props.src }></source>
              Your browser does not support the video element
            </video> :
            token.props.isAudioPreview ?
            <audio controls>
              <source src={ token.props.src }></source>
              Your browser does not support audio element
            </audio> :
            token.props.isText ?
            <Container className='link-alert'>
              <Link to={ `/nft/${props.address}/${props.tokenId}` }>
                <Alert variant='info'>
                  Text files not supported yet
                </Alert>
              </Link>
            </Container> :
            token.props.is3D ?
            // <model-viewer src={ token.props.src }></model-viewer> :
            <Container className='link-alert'>
              <Link to={ `/nft/${props.address}/${props.tokenId}` }>
                <Alert variant='info'>
                  3D assets not supported yet
                </Alert>
              </Link>
            </Container> :
            <Container className='link-alert'>
              <Link to={ `/nft/${props.address}/${props.tokenId}` }>
                <Alert variant='info'>
                  Unrecognized file format
                </Alert>
              </Link>
            </Container>
          ) :
          error ?
          <Container className='link-alert'>
            <Alert variant='info'>
              Loading failed
            </Alert>
          </Container> :
          <Container className='text-center'>
            <Spinner animation='grow' role='status' />
          </Container>
        }
        </div>
        <Card.Body>
          { token.props.title ?
            <Card.Title>
              <Link to={ `/nft/${props.address}/${props.tokenId}` }>
                { token.props.title }
              </Link>
            </Card.Title> :
            <Placeholder as={Card.Title} animation='wave'>
              <Placeholder xs={8} />
            </Placeholder> }
          { token.props.title ?
            <Card.Text className='text-muted'>
              { token.props.description }
            </Card.Text> :
            <Placeholder as={Card.Text} animation='wave'>
              <Placeholder xs={5} bg='light' />{' '}
              <Placeholder xs={4} bg='light' />{' '}
              <Placeholder xs={8} bg='light' />
            </Placeholder> }
        </Card.Body>
        { (token.props.creator || token.props.owner ) ?
          <Card.Footer className='text-muted'>
            { token.props.creator &&
              <Address address={token.props.creator} prefix={'Created by'} />
            }
            { !token.props.creator && token.props.createdBy }
            { !token.props.creator && token.props.owner &&
              <Address address={token.props.owner} prefix={'Owned by'} />
            }
          </Card.Footer> :
          <Placeholder as={Card.Footer} animation='wave'>
            <Placeholder xs={2} bg='light' />{' '}
            <Placeholder xs={1} bg='light' />{' '}
            <Placeholder xs={3} bg='light' />
          </Placeholder>
        }
      </Card>
    </Col>
  )
}
