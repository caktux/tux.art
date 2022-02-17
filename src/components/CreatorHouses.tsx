
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'
import { Link } from 'react-router-dom'

import Spinner from 'react-bootstrap/Spinner'
import Alert from 'react-bootstrap/Alert'
import Table from 'react-bootstrap/Table'
import Form from 'react-bootstrap/Form'

import Address from './Address'
import TokenAmount from 'token-amount'

import { getCreatorHouses } from '../fetchers/houses'


export default function CreatorHouses(props: any) {
  const { provider } = useEthereum()

  const mounted = useRef(true)

  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ creatorHouses, setCreatorHouses ] = useState([])

  useEffect(() => {
    const fetchCreatorHouses = async () => {
      if (fetched || !props.address || !mounted.current)
        return
      setFetched(true)
      const houses = await getCreatorHouses(provider, props.address)
      if (!mounted.current)
        return
      setCreatorHouses(houses ? houses : [])
      setLoaded(true)
    }
    fetchCreatorHouses()
  })

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <>
      <Table responsive striped hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Curator</th>
            <th className='text-end'>Fee</th>
            <th className='text-center'>Pre-approved</th>
            <th className='text-center'>Bids</th>
            <th className='text-center'>Sales</th>
            <th className='text-end'>Total fees</th>
          </tr>
        </thead>
        <tbody>
        { creatorHouses && creatorHouses.length > 0 &&
          creatorHouses.map((house: any, idx: number) => {
            return (
              <tr key={idx}>
                <td className='align-middle'>
                  <Link to={ `/house/${house.id}` }>
                    {house.name}
                  </Link>
                </td>
                <td className='align-middle'>
                  <div className='text-muted'>
                    <Address address={house.curator} />
                  </div>
                </td>
                <td className='align-middle text-end'>
                  {house.fee} %
                </td>
                <td className='align-middle text-center'>
                  { house.preApproved ?
                    <Form.Check checked disabled /> :
                    <Form.Check disabled />
                  }
                </td>
                <td className='align-middle text-center'>{house.bids}</td>
                <td className='align-middle text-center'>{house.sales}</td>
                <td className='align-middle text-end'>
                  {
                    TokenAmount.format(house.feesTotal, 18, {
                      symbol: 'Ξ',
                      digits: 5,
                      commify: true
                    })
                  }
                </td>
              </tr>
            )
          })
        }
        </tbody>
      </Table>
      { !loaded &&
        <Alert variant='dark' className='text-center'>
          <Spinner animation='grow' role='status' />
        </Alert>
      }
      { loaded && creatorHouses.length === 0 &&
        <Alert variant='dark' className='text-center'>
          No houses as creator
        </Alert>
      }
    </>
  )
}
