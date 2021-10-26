
import { useState } from 'react'
import { useWallet } from 'use-wallet'

import Container from 'react-bootstrap/Container'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'

import { ethers, Signer } from 'ethers'
import { TuxERC20 } from '../abi/TuxERC20'
import { TUXTOKEN } from '../constants/contracts'


export default function Payouts(props: any) {
  const { account, ethereum } = useWallet()

  const [ error, setError ] = useState(false as any)
  const [ pending, setPending ] = useState(false)
  const [ validated, setValidated ] = useState(false)
  const [ addressInvalid, setAddressInvalid ] = useState(false)
  const [ txResult, setTxResult ] = useState('')
  const [ success, setSuccess ] = useState('')


  const handleSubmit = (event: any) => {
    const form = event.currentTarget;
    event.preventDefault()
    event.stopPropagation()

    if (form.checkValidity() === false) {
      setValidated(true)
    } else {
      setValidated(false)
      setPending(true)

      const addPayoutAddress = async () => {
        const signer = new ethers.providers.Web3Provider(ethereum).getSigner()

        const contract = new ethers.Contract(TUXTOKEN, TuxERC20, signer as Signer)

        const owner = await contract.owner().catch((e: any) => {
          console.warn(`In contract.owner`, e.error ? e.error.message : e.message)
          if (e.error && e.error.message)
            setError(e.error.message.replace('execution reverted: ', ''))
          else
            setError(e.message)
          setPending(false)
          return
        })
        if (owner !== account) {
          setError('Not contract owner')
          setPending(false)
          return
        }

        const tx = await contract.addPayoutAddress(event.target[0].value).catch((e: any) => {
          console.warn(`In addPayoutAddress`, e.error ? e.error.message : e.message)
          if (e.error && e.error.message)
            setError(e.error.message.replace('execution reverted: ', ''))
          else
            setError(e.message)
          setPending(false)
          return
        })

        if (tx && tx.hash) {
          setTxResult(tx.hash)
          await tx.wait()
          setSuccess(`${event.target[0].value} added successfully`)
        }

        setPending(false)
      }
      addPayoutAddress()
    }
  }

  const handleChange = (event: any) => {
    if (event.currentTarget.checkValidity() === false) {
      event.preventDefault()
      event.stopPropagation()
      setValidated(false)
    } else {
      if (event.target.id === 'validationAddress' &&
          !ethers.utils.isAddress(event.target.value)) {
        setAddressInvalid(true)
        setValidated(false)
        return
      }
      setAddressInvalid(false)
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
          { success }
        </Alert>
      }
      { pending &&
        <Container className='text-center'>
          <Spinner animation='grow' role='status' />
        </Container>
      }
      { !pending && account &&
        <Form noValidate validated={validated} onSubmit={handleSubmit} onChange={handleChange}>
          <Row className='mb-3'>
            <Form.Group as={Col} controlId='validationAddress'>
              <Form.Label>Payout address</Form.Label>
              <Form.Control
                required
                type='text'
                placeholder='0x...'
                max={42}
                htmlSize={42}
                isInvalid={addressInvalid}
                pattern='^0x[a-fA-F0-9]{40}'
              />
              <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              <Form.Control.Feedback type="invalid">
                Please enter a valid address.
              </Form.Control.Feedback>
            </Form.Group>
          </Row>
          <Button type='submit'>
            Add payout address
          </Button>
        </Form>
      }
    </Container>
  )
}
