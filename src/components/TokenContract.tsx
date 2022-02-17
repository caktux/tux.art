
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'
import { useWallet } from 'use-wallet'

import { useRouteMatch, useHistory, useParams, Link } from 'react-router-dom'

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

import { getLatestNFTs } from '../fetchers/latest'
import { getContractOwner } from '../fetchers/contracts'
import { getTokenContractGraph } from '../fetchers/contracts-graph'


export default function TokenContract(props: any) {
  const { provider } = useEthereum()
  const { account } = useWallet()
  const history = useHistory()
  const params = useParams<any>()
  const { path } = useRouteMatch()

  const [ offset, setOffset ] = useState(path === '/contract/:address/:offset?' && params.offset ? parseInt(params.offset, 10): 0)
  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ backDisabled, setBackDisabled ] = useState(true)
  const [ forwardDisabled, setForwardDisabled ] = useState(true)
  const [ tokens, setTokens ] = useState([])
  const [ owner, setOwner ] = useState('')
  const [ ownerFetched, setOwnerFetched ] = useState(false)
  const [ graphAvailable, setGraphAvailable ] = useState(true)

  const mounted = useRef(true)

  const updateTokens = (tokens: any, total: number) => {
    if (!mounted.current)
      return

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
    if (path === '/contract/:address/:offset?')
      history.push(`/contract/${props.contract.tokenContract}/${offset - props.limit}`)
  }

  const handleForward = () => {
    setOffset((offset) => { return offset + props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
    setLoaded(false)
    if (path === '/contract/:address/:offset?')
      history.push(`/contract/${props.contract.tokenContract}/${offset + props.limit}`)
  }

  useEffect(() => {
    const fetchAuctions = async () => {
      if (fetched || loaded || !graphAvailable || !props.contract.auctions || !props.contract.tokenContract || !mounted.current)
        return
      setFetched(true)

      let tokens = []
      if (offset === 0)
        tokens = props.contract.tokens
      else {
        const [contract, timedOut] = await getTokenContractGraph(props.contract.address, props.limit, offset)

        if (!mounted.current)
          return

        if (contract && !timedOut)
          tokens = contract.tokens
        else {
          setGraphAvailable(false)
          setFetched(false)
        }
      }

      if (!mounted.current)
        return

      updateTokens(tokens ? tokens : [], props.contract.totalAuctions)
      setLoaded(true)
    }
    fetchAuctions()
  })

  useEffect(() => {
    const fetchNFTs = async () => {
      if (fetched || loaded || props.contract.auctions || !props.contract.tokenContract || !mounted.current)
        return
      setFetched(true)

      const [total, tokens] = await getLatestNFTs(provider, props.contract.tokenContract, props.limit, offset)

      if (!mounted.current)
        return

      updateTokens(tokens ? tokens : [], total)
      setLoaded(true)
    }
    fetchNFTs()
  })

  useEffect(() => {
    const fetchOwner = async () => {
      if (ownerFetched || !props.contract.tokenContract || !mounted.current)
        return
      setOwnerFetched(true)

      const owner = await getContractOwner(provider, props.contract.tokenContract)

      if (!mounted.current)
        return

      setOwner(owner)
    }
    fetchOwner()
  })

  useEffect(() => {
    if (!mounted.current || path !== '/contract/:address/:offset?')
      return

    const paramsOffset = params.offset ? parseInt(params.offset, 10) : 0

    if (paramsOffset === offset)
      return

    setTokens([])
    setOffset(paramsOffset)
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
    setLoaded(false)
  }, [params.offset, offset, path])

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <Container fluid>
      <Card.Header className='mb-2'>
        <Row xs={1}>
          <Col xs={6} className='vertical-align'>
            { path !== '/contract/:address/:offset?' ?
              <Link to={`/contract/${props.contract.tokenContract}`}>
                {props.contract.name}
              </Link> :
              props.contract.name
            }
          </Col>
          <Col xs={6} className='text-end'>
            <ButtonGroup>
              { owner && account === owner &&
                <Button size='sm' variant='success' className='me-3' href={`/#/mint/${props.contract.tokenContract}`}>
                  Mint in this collection
                </Button>
              }
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
      <Row xs={1} md={2} xl={4}>
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
                tokenId={token.tokenId}
                address={props.contract.tokenContract}
                name={props.contract.name}
                key={`token-${props.contract.tokenContract}-${idx}`} />
            )
          return []
        })
      }
      { !loaded && tokens.length === 0 &&
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
      { props.limit > 4 &&
        <Card.Header>
          <Row xs={1}>
            <Col className='text-end'>
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
      }
    </Container>
  )
}
