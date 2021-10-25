
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


export const UpdateFeeForm = (props: any) => {
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

      const updateFee = async () => {
        const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
        const contract = new ethers.Contract(AUCTIONS, Auctions, signer as Signer)

        const tx = await contract.updateFee(
          props.houseId,
          Math.floor(parseFloat(event.target[0].value) * 100)
        ).catch((e: any) => {
          console.warn(`In updateFee`, e.data ? e.data.message : e.message)
          if (e.data && e.data.message)
            setError(e.data.message)
          else
            setError(e.message)
        })

        if (tx && tx.hash) {
          setTxResult(tx.hash)
          await tx.wait()
          setSuccess(`Fee updated to ${event.target[0].value}% successfully!`)
        }

        setPending(false)
        props.setFetched(false)
      }
      updateFee()
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
      setTxResult('')
      setSuccess('')
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
            <Form.Group as={Col} controlId="validationFee">
              <Form.Label>Curation fee percentage</Form.Label>
              <InputGroup>
                <Form.Control
                  type='number'
                  min={0.00}
                  max={90.00}
                  step={0.01}
                  placeholder='0.00'
                  aria-label='Curation fee %' />
                <InputGroup.Text>%</InputGroup.Text>
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                <Form.Control.Feedback type="invalid">
                  Please enter a valid number.
                </Form.Control.Feedback>
              </InputGroup>
            </Form.Group>
          </Row>
          { ethereum &&
            <Button type='submit' disabled={!validated}>
              Update fee
            </Button>
          }
        </Form>
      }
    </Container>
  )
}
