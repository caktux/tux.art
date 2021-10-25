
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


export const MakeOfferForm = (props: any) => {
  const { ethereum } = useWallet()

  const [ error, setError ] = useState(false as any)
  const [ validated, setValidated ] = useState(false)
  const [ pending, setPending ] = useState(false)
  const [ txResult, setTxResult ] = useState('')
  const [ success, setSuccess ] = useState('')


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

        const tx = await contract.makeOffer(
          props.tokenContract,
          props.tokenId,
          { value: amount }
        ).catch((e: any) => {
          console.warn(`In makeOffer`, e.data ? e.data.message : e.message)
          if (e.data && e.data.message)
            setError(e.data.message)
          else
            setError(e.message)
        })

        if (tx && tx.hash) {
          setTxResult(tx.hash)
          await tx.wait()
          setSuccess(`Successfully placed your offer!`)
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
      { !pending &&
        <Form noValidate validated={validated} onSubmit={handleSubmit} onChange={handleChange}>
          <Row className='mb-3'>
            <Form.Group as={Col} controlId="validationBid">
              <Form.Label>Offer amount</Form.Label>
              <InputGroup>
                <Form.Control
                  required
                  size='lg'
                  type='number'
                  min={0.001}
                  step={0.001}
                  placeholder='Offer amount in ETH'
                  aria-label='Offer amount in ETH' />
                <InputGroup.Text>Ξ</InputGroup.Text>
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                <Form.Control.Feedback type="invalid">
                  Please enter a valid amount.
                </Form.Control.Feedback>
              </InputGroup>
              <Form.Text id="offerAmountHelp" muted>
                Minimum offer is 0.001 Ξ
              </Form.Text>
            </Form.Group>
          </Row>
          { ethereum &&
            <Button type='submit' disabled={!validated}>
              Make offer
            </Button>
          }
        </Form>
      }
    </Container>
  )
}
