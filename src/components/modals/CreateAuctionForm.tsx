
import { useState, useEffect } from 'react'
import { useEthereum } from '../../hooks/ethereum'
import { useWallet } from 'use-wallet'

import InputGroup from 'react-bootstrap/InputGroup'
import Container from 'react-bootstrap/Container'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'

import { ethers, Signer } from 'ethers'
import { ERC721 } from '../../abi/ERC721'
import { Auctions } from '../../abi/Auctions'
import { AUCTIONS } from '../../constants/contracts'
import { getCreatorHouses, getCuratorHouses } from '../../fetchers/houses'


export const CreateAuctionForm = (props: any) => {
  const { provider } = useEthereum()
  const { account, ethereum } = useWallet()

  const [ fetched, setFetched ] = useState(false)
  const [ approved, setApproved ] = useState(false)
  const [ checkedApproved, setCheckedApproved] = useState(false)
  const [ validated, setValidated ] = useState(false)
  const [ error, setError ] = useState(false as any)
  const [ pending, setPending ] = useState(false)
  const [ txResult, setTxResult ] = useState('')
  const [ success, setSuccess ] = useState('')
  const [ houses, setHouses ] = useState([])


  useEffect(() => {
    const fetchHouses = async () => {
      if (fetched || !account)
        return
      setFetched(true)
      const creatorHouses = await getCreatorHouses(provider, account)
      const curatorHouses = await getCuratorHouses(provider, account)
      setHouses(creatorHouses.concat(curatorHouses))
    }
    fetchHouses()
  })

  useEffect(() => {
    const checkApproved = async () => {
      if (checkedApproved || !account)
        return
      setCheckedApproved(true)
      // setHouses([]) // TODO?

      const contract = new ethers.Contract(props.tokenContract, ERC721, provider)

      const approvedAddress = await contract.getApproved(props.tokenId).catch((e: any) => {
        console.warn(`In getApproved`, e.message)
      })
      if (approvedAddress === AUCTIONS)
        setApproved(true)

      const isApprovedForAll = await contract.isApprovedForAll(account, AUCTIONS).catch((e: any) => {
        console.warn(`In isApprovedForAll`, e.message)
      })
      if (isApprovedForAll)
        setApproved(true)
    }
    checkApproved()
  })

  const approveAuctions = async () => {
    setPending(true)

    const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
    const contract = new ethers.Contract(props.tokenContract, ERC721, signer as Signer)

    const tx = await contract.approve(AUCTIONS, props.tokenId).catch((e: any) => {
      console.warn(`In approve`, e.message)
      setError(e.message)
    })

    if (tx && tx.hash) {
      setTxResult(tx.hash)
      await tx.wait()
    }

    setCheckedApproved(false)
    setFetched(false)
    setPending(false)
  }

  const approveAuctionsForAll = async () => {
    setPending(true)

    const signer = new ethers.providers.Web3Provider(ethereum).getSigner()

    const contract = new ethers.Contract(props.tokenContract, ERC721, signer as Signer)
    const tx = await contract.setApprovalForAll(AUCTIONS, true).catch((e: any) => {
      console.warn(`In setApprovalForAll`, e.message)
      setError(e.message)
    })

    if (tx && tx.hash) {
      setTxResult(tx.hash)
      await tx.wait()
    }

    setCheckedApproved(false)
    setFetched(false)
    setPending(false)
  }

  const handleSubmit = (event: any) => {
    event.preventDefault()
    event.stopPropagation()

    if (event.currentTarget.checkValidity() === false) {
      setValidated(true)
    } else {
      setValidated(false)
      setPending(true)

      const createAuction = async () => {
        const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
        const contract = new ethers.Contract(AUCTIONS, Auctions, signer as Signer)

        const tx = await contract.createAuction(
          props.tokenContract,
          props.tokenId,
          event.target[1].value * 3600,
          ethers.utils.parseUnits(event.target[0].value, 'ether'),
          event.target[2].value,
        ).catch((e: any) => {
          console.warn(`In createAuction`, e.error ? e.error.message : e.message)
          if (e.error && e.error.message)
            setError(e.error.message.replace('execution reverted: ', ''))
          else
            setError(e.message)
        })

        if (tx && tx.hash) {
          setTxResult(tx.hash)
          await tx.wait()
          setSuccess(`Auction successfully created!`)
        }

        setPending(false)
        props.setLoaded(false)
        props.setFetched(false)
      }
      createAuction()
    }
  }

  const handleChange = (event: any) => {
    if (event.currentTarget.checkValidity() === false) {
      event.preventDefault()
      event.stopPropagation()
      setValidated(false)
    } else {
      setValidated(true)
      setError(false)
    }
  }

  return (
    <Container>
      { error &&
        <Alert variant='danger' onClose={() => setError('')} dismissible>
          {error}
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
      { success &&
        <Alert variant='success' onClose={() => setSuccess('')} dismissible>
          {success}
        </Alert>
      }
      { pending &&
        <Container className='text-center'>
          <Spinner animation='grow' role='status' />
        </Container>
      }
      { !approved && !pending &&
        <Alert variant='danger'>
          <p className='text-center'>
            The auction contract needs to be approved to transfer this token from your account{' '}
            to the contract itself.
          </p>
          <div className='d-grid gap-2'>
            <Button onClick={approveAuctions} size='lg'>
              Approve for this token only
            </Button>
            <Button onClick={approveAuctionsForAll} size='lg'>
              Approve for all tokens
            </Button>
          </div>
        </Alert>
      }
      { approved && !pending && props.auction.reservePrice.eq(0) &&
        <Form noValidate validated={validated} onSubmit={handleSubmit} onChange={handleChange}>
          <Row className='mb-3'>
            <Form.Group as={Col} controlId="validationPrice">
              <Form.Label>Reserve price</Form.Label>
              <InputGroup>
                <Form.Control
                  required
                  size='lg'
                  type='number'
                  min={0.00001}
                  step={0.00001}
                  placeholder='Reserve price in ETH'
                  aria-label='Reserve price in ETH' />
                <InputGroup.Text>Ξ</InputGroup.Text>
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                <Form.Control.Feedback type="invalid">
                  Please enter a reserve price.
                </Form.Control.Feedback>
              </InputGroup>
            </Form.Group>
          </Row>
          <Row className='mb-3'>
            <Form.Group as={Col} controlId="validationDuration">
              <Form.Label>Duration in hours</Form.Label>
              <InputGroup>
                <Form.Control
                  type='number'
                  min={0}
                  max={8760} // 1 year
                  step={1}
                  defaultValue='24'
                  aria-label='Duration' />
                <InputGroup.Text>h</InputGroup.Text>
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                <Form.Control.Feedback type="invalid">
                  Please enter a valid number.
                </Form.Control.Feedback>
              </InputGroup>
              <Form.Text id="durationHelp" muted>
                A duration of 0 will show a "Buy now" button
              </Form.Text>
            </Form.Group>
          </Row>
          <Row className='mb-3'>
            <Form.Group as={Col} controlId="validationHouseID">
              <Form.Label>House</Form.Label>
              <Form.Select aria-label="House">
                <option value='0'>None</option>
                { houses.map((house: any, idx: number) => {
                    return (
                      <option key={`house-select-${idx}`} value={house.id}>
                        {house.name} - {house.fee} % fee
                      </option>
                    )
                  }) }
              </Form.Select>
              <Form.Text id="houseHelp" muted>
                Choosing a curation house is optional
              </Form.Text>
              <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              <Form.Control.Feedback type="invalid">
                Please choose a valid house.
              </Form.Control.Feedback>
            </Form.Group>
          </Row>
          { ethereum &&
            <Button type='submit' disabled={!validated}>
              Start
            </Button>
          }
        </Form>
      }
    </Container>
  )
}
