
import { useState } from 'react'
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
import { Auctions } from '../../abi/Auctions'
import { AUCTIONS } from '../../constants/contracts'


export const FeatureForm = (props: any) => {
  const { ethereum } = useWallet()

  const [ error, setError ] = useState(false as any)
  const [ validated, setValidated ] = useState(true)
  const [ pending, setPending ] = useState(false)
  const [ txResult, setTxResult ] = useState('')


  const handleSubmit = (event: any) => {
    event.preventDefault()
    event.stopPropagation()

    if (event.currentTarget.checkValidity() === false) {
      setValidated(true)
    } else {
      setValidated(false)
      setPending(true)

      const submitBid = async () => {
        const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
        const contract = new ethers.Contract(AUCTIONS, Auctions, signer as Signer)

        const amount = ethers.utils.parseUnits(event.target[0].value, 'ether')

        const tx = await contract.feature(
          props.auction.id,
          amount
        ).catch((e: any) => {
          console.warn(`In contract.feature`, e.data ? e.data.message : e.message)
          if (e.data && e.data.message)
            setError(e.data.message.slice(0, e.data.message.length - 1).slice(79, e.data.message.length))
          else
            setError(e.message)
        })

        if (tx && tx.hash) {
          setTxResult(tx.hash)
          props.setHasTxResult(true)
          await tx.wait()
        }

        setPending(false)
        props.setLoaded(false)
        props.setFetched(false)
      }
      submitBid()
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
      { pending &&
        <Container className='text-center'>
          <Spinner animation='grow' role='status' />
        </Container>
      }
      {
        !pending && txResult &&
        <Alert variant='success'>
          { "Successfully added to featured queue!" }
        </Alert>
      }
      { !pending && !txResult && props.auction && // props.auction.bidder !== account &&
        <Form noValidate validated={validated} onSubmit={handleSubmit} onChange={handleChange}>
          <Row className='mb-3'>
            <Form.Group as={Col} controlId="validationBid">
              <Form.Label>
                Featured price to be paid
              </Form.Label>
              <InputGroup>
                <Form.Control
                  required
                  size='lg'
                  type='number'
                  min={1}
                  step={0.00001}
                  defaultValue={1}
                  placeholder='Featured price in TUX'
                  aria-label='Featured price in TUX' />
                <InputGroup.Text>TUX</InputGroup.Text>
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                <Form.Control.Feedback type="invalid">
                  Please enter a valid amount.
                </Form.Control.Feedback>
              </InputGroup>
              <Form.Text id="bidAmountHelp" muted>
                Minimum featured price is 1 TUX
              </Form.Text>
            </Form.Group>
          </Row>
          { ethereum &&
            <Button type='submit' disabled={!validated}>
              Feature my { props.isAuction ?
                'auction' :
                'listing' }
            </Button>
          }
        </Form>
      }
    </Container>
  )
}
