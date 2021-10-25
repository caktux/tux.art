
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'

import Container from 'react-bootstrap/Container'
// import Spinner from 'react-bootstrap/Spinner'
// import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import { getFeatured } from '../fetchers/featured'
import { getActiveAuctions } from '../fetchers/auctions'
import FeaturedItem from './FeaturedItem'

import { emptyAuction } from '../utils/nfts'


export const Featured = (props: any) => {
  const { provider } = useEthereum()

  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ auction, setAuction ] = useState(emptyAuction)
  // const [ fetchedTime, setFetchedTime ] = useState(false)
  // const [ nextFeaturedTime, setNextFeaturedTime ] = useState(0)

  const mounted = useRef(true)


  const updateAuction = (auction: any) => {
    if (!mounted.current)
      return

    if (!auction) {
      const fetchLatestAuction = async () => {
        const [total, auctions] = await getActiveAuctions(provider, 1, '0')

        if (!mounted.current)
          return

        if (!auctions || auctions.length === 0) {
          setLoaded(true)
          return
        }

        latestAuction(auctions[0], total)
      }
      fetchLatestAuction()
      return
    }

    setAuction(auction)

    setLoaded(true)
  }

  const latestAuction = (auction: any, total: number) => {
    if (!mounted.current)
      return

    setAuction(auction)

    setLoaded(true)
  }

  useEffect(() => {
    const fetchAuction = async () => {
      if (fetched || !mounted.current)
        return
      setFetched(true)

      const auction = await getFeatured(provider)

      if (!mounted.current)
        return

      updateAuction(auction)
    }
    fetchAuction()
  })

  // useEffect(() => {
  //   const fetchNextFeaturedTime = async () => {
  //     if (fetchedTime || !mounted.current)
  //       return
  //     setFetchedTime(true)
  //
  //     const nextFeaturedTime = await getNextFeaturedTime(provider)
  //
  //     if (!mounted.current)
  //       return
  //
  //     setNextFeaturedTime(nextFeaturedTime)
  //   }
  //   fetchNextFeaturedTime()
  // })

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <>
      <Row className='justify-content-sm-center mb-4'>
        <Col sm='11' xl='10' className='featuredContainer'>

            <FeaturedItem
              auction={auction}
              tokenId={auction.tokenId}
              address={auction.tokenContract}
              loaded={loaded} />

            {
              // !loaded &&
              // <Container fluid>
              //   <Alert variant='dark' className='text-center'>
              //     <Spinner animation='grow' role='status' />
              //   </Alert>
              // </Container>
            }
            { loaded && !auction &&
              <Container fluid>
                <Alert variant='dark' className='text-center'>
                  No featured or latest auction could be found
                </Alert>
              </Container>
            }

        </Col>
      </Row>

      {
      // <Alert variant='dark' className='text-center text-muted'>
      //   { nextFeaturedTime > 0 ?
      //     <>
      //       Next featured auction after { new Date(nextFeaturedTime * 1000).toLocaleString() }
      //     </> : <Spinner animation='grow' role='status' />
      //   }
      // </Alert>
      }
    </>
  )
}
