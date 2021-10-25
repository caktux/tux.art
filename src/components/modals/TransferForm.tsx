
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
import { ERC721 } from '../../abi/ERC721'


export const TransferForm = (props: any) => {
  const { account, ethereum } = useWallet()

  const [ error, setError ] = useState(false as any)
  const [ validated, setValidated ] = useState(false)
  const [ addressInvalid, setAddressInvalid ] = useState(false)
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

      const transferToken = async () => {
        const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
        const contract = new ethers.Contract(props.token.address, ERC721, signer as Signer)

        const tx = await contract.transferFrom(
          account,
          event.target[0].value,
          props.token.id
        ).catch((e: any) => {
          console.warn(`In transferFrom`, e.data ? e.data.message : e.message)
          if (e.data && e.data.message)
            setError(e.data.message)
          else
            setError(e.message)
        })

        if (tx && tx.hash) {
          setTxResult(tx.hash)
          await tx.wait()
          setSuccess(`NFT transferred successfully!`)
        }

        setPending(false)
        props.setFetched(false)
      }
      transferToken()
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
          {success}
        </Alert>
      }
      { pending &&
        <Container className='text-center'>
          <Spinner animation='grow' role='status' />
        </Container>
      }
      { !pending && !success &&
        <Form noValidate validated={validated} onSubmit={handleSubmit} onChange={handleChange}>
          <Row className='mb-3'>
            <Form.Group as={Col} controlId='validationAddress'>
              <Form.Label>Recipient's address</Form.Label>
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
          { ethereum &&
            <Button type='submit' disabled={!validated}>
              Transfer NFT
            </Button>
          }
        </Form>
      }
    </Container>
  )
}
