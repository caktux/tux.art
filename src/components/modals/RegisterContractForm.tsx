
import { useState } from 'react'
import { useWallet } from 'use-wallet'
import { useEthereum } from '../../hooks/ethereum'

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


export const RegisterContractForm = (props: any) => {
  const { account, ethereum } = useWallet()
  const { provider } = useEthereum()

  const [ error, setError ] = useState(false as any)
  const [ validated, setValidated ] = useState(false)
  const [ contractInvalid, setContractInvalid ] = useState(false)
  const [ pending, setPending ] = useState(false)
  const [ txResult, setTxResult ] = useState('')
  const [ contractName, setContractName ] = useState('')
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

      const registerTokenContract = async () => {
        const tokenContract = event.target[0].value

        let contract = new ethers.Contract(tokenContract, ERC721, provider)

        const name = await contract.name().catch((e: any) => {
          console.warn(`In contract.name`, e.error ? e.error.message : e.message)
          if (e.error && e.error.message)
            setError(e.error.message.replace('execution reverted: ', ''))
          else
            setError(e.message)
          setPending(false)
          return
        })
        setContractName(name)

        const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
        contract = new ethers.Contract(AUCTIONS, Auctions, signer as Signer)

        const tx = await contract.registerTokenContract(tokenContract).catch((e: any) => {
          console.warn(`In registerTokenContract`, e.error ? e.error.message : e.message)
          if (e.error && e.error.message)
            setError(e.error.message.replace('execution reverted: ', ''))
          else
            setError(e.message)
        })

        if (tx && tx.hash) {
          setTxResult(tx.hash)
          await tx.wait()
          setSuccess(tokenContract)
        }

        setPending(false)
        props.setFetched(false)
      }
      registerTokenContract()
    }
  }

  const handleChange = (event: any) => {
    if (event.currentTarget.checkValidity() === false) {
      event.preventDefault()
      event.stopPropagation()
      setValidated(false)
    } else {
      if (event.target.id === 'validationContract' &&
          !ethers.utils.isAddress(event.target.value)) {
        setContractInvalid(true)
        setValidated(false)
        return
      }
      setValidated(true)
      setError(false)
      setSuccess('')
    }
  }

  return (
    <Container>
      <Alert variant='secondary'>
        Register any compatible ERC721 contract. Both the Metadata and Enumerable extensions
        must be supported. See <a href='https://eips.ethereum.org/EIPS/eip-721' target='blank'>
        https://eips.ethereum.org/EIPS/eip-721</a>
      </Alert>
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
          <Alert.Link href={`#/contract/${success}`} as={'a'}>
            {contractName}
          </Alert.Link> registered successfully!
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
            <Form.Group as={Col} controlId='validationContract'>
              <Form.Label>Minting contract address</Form.Label>
              <Form.Control
                required
                type='text'
                placeholder='0x...'
                max={42}
                htmlSize={42}
                isInvalid={contractInvalid}
                pattern='^0x[a-fA-F0-9]{40}'
              />
              <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              <Form.Control.Feedback type="invalid">
                Please enter a valid address.
              </Form.Control.Feedback>
            </Form.Group>
          </Row>
          <Button type='submit'>
            Register
          </Button>
        </Form>
      }
    </Container>
  )
}
