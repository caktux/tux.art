
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'
import { useWallet } from 'use-wallet'

import { Link } from 'react-router-dom'

import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Container from 'react-bootstrap/Container'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Card from 'react-bootstrap/Card'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import AuctionItem from '../components/AuctionItem'
import ListItem from '../components/ListItem'

import { getOwnedNFTs } from '../fetchers/owned'


export default function OwnedList(props: any) {
  const { provider } = useEthereum()
  const { account } = useWallet()

  const [ offset, setOffset ] = useState(0)
  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ backDisabled, setBackDisabled ] = useState(true)
  const [ forwardDisabled, setForwardDisabled ] = useState(true)
  const [ tokens, setTokens ] = useState([])

  const mounted = useRef(true)

  const updateTokens = (tokens: any, total: number) => {
    setTokens(tokens)

    if (backDisabled && offset >= props.limit)
      setBackDisabled(false)
    else if (!backDisabled && offset <= props.limit)
      setBackDisabled(true)
    if (forwardDisabled && offset + props.limit < total)
      setForwardDisabled(false)
    else if (!forwardDisabled && offset + props.limit >= total)
      setForwardDisabled(true)
  }

  const handleBack = () => {
    setOffset((offset) => { return offset - props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
    setLoaded(false)
  }

  const handleForward = () => {
    setOffset((offset) => { return offset + props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
    setLoaded(false)
  }

  useEffect(() => {
    const fetchNFTs = async () => {
      if (fetched || loaded || !props.contract.tokenContract || !props.account || !mounted.current)
        return
      setFetched(true)

      const [total, tokens] = await getOwnedNFTs(
        provider,
        props.contract.tokenContract,
        props.account,
        props.limit,
        offset
      )

      if (!mounted.current)
        return

      updateTokens(tokens ? tokens : [], total)
      setLoaded(true)
    }
    fetchNFTs()
  })

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <Container fluid>
      <Card.Header className='mb-2'>
        <Row xs={1}>
          <Col xs={9} className='vertical-align'>
            <Link to={`/contract/${props.contract.tokenContract}`}>
              {props.contract.name}
            </Link>
          </Col>
          <Col xs={3} className='text-end'>
            { props.contract.owner && account === props.contract.owner &&
              <>
                <Button size='sm' variant='success' href={`/#/mint/${props.contract.tokenContract}`}>
                  Mint in this collection
                </Button>{' '}
              </>
            }
            <ButtonGroup>
              <Button
                size='sm'
                onClick={handleBack}
                disabled={backDisabled}>{'←'}</Button>
              <Button
                size='sm'
                onClick={handleForward}
                disabled={forwardDisabled}>{'→'}</Button>
            </ButtonGroup>
          </Col>
        </Row>
      </Card.Header>
      <Row xs={1} sm={2} xl={4}>
      { tokens.map((token: any, idx: number) => {
          if (token.auction)
            return (
              <AuctionItem
                auction={token.auction}
                tokenId={token.auction.tokenId}
                address={token.auction.tokenContract}
                house={props.house}
                loaded={loaded}
                key={`token-${props.tokenId}-${idx}`} />
            )
          else if (token.tokenId)
            return (
              <ListItem
                loaded={loaded}
                name={props.contract.name}
                address={props.contract.tokenContract}
                tokenId={token.tokenId}
                key={`token-${props.tokenId}-${idx}`} />
            )
          return []
        })
      }
      { !loaded &&
        <Container fluid>
          <Alert variant='dark' className='text-center'>
            <Spinner animation='grow' role='status' />
          </Alert>
        </Container>
      }
      { loaded && tokens.length === 0 &&
        <Container fluid>
          <Alert variant='dark' className='text-center'>
            That's all the NFTs that could be found
          </Alert>
        </Container>
      }
      </Row>
    </Container>
  )
}
