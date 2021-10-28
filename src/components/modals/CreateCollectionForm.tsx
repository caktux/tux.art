
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
import { Collection } from '../../abi/CollectionFull'
import { Auctions } from '../../abi/Auctions'
import { AUCTIONS } from '../../constants/contracts'


export const CreateCollectionForm = (props: any) => {
  const { account, ethereum } = useWallet()

  const [ error, setError ] = useState(false as any)
  const [ validated, setValidated ] = useState(false)
  const [ pending, setPending ] = useState(false)
  const [ collectionTxResult, setCollectionTxResult ] = useState({ hash: '', address: ''})
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

      const createHouse = async () => {
        const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
        const collection = new ethers.ContractFactory(Collection.abi, Collection.bytecode, signer as Signer)

        let collectionContract = null as any

        try {
          collectionContract = await collection.deploy(event.target[0].value, 'TUX')
          setCollectionTxResult({
            hash: collectionContract.deployTransaction.hash,
            address: collectionContract.address
          })
          await collectionContract.deployed()
        } catch (e: any) {
          console.warn(`In collection.deploy`, e.error ? e.error.message : e.message)
          if (e.error && e.error.message)
            setError(e.error.message.replace('execution reverted: ', ''))
          else
            setError(e.message)
          setPending(false)
          props.setFetched(false)
          return
        }

        const contract = new ethers.Contract(AUCTIONS, Auctions, signer as Signer)

        const tx = await contract.registerTokenContract(collectionContract.address).catch((e: any) => {
          console.warn(`In registerTokenContract`, e.error ? e.error.message : e.message)
          if (e.error && e.error.message)
            setError(e.error.message.replace('execution reverted: ', ''))
          else
            setError(e.message)
        })

        if (tx && tx.hash) {
          setTxResult(tx.hash)
          await tx.wait()
          setSuccess(event.target[0].value)
        }

        setPending(false)
        props.setFetched(false)
      }
      createHouse()
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
      setSuccess('')
    }
  }

  return (
    <Container>
      <Alert variant='secondary'>
        Creating a collection requires two transactions. You will be deploying your own
        minting contract with the first one, then registering it on Tux with the second.
      </Alert>
      { error &&
        <Alert variant='danger' onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      }
      { collectionTxResult.hash &&
        <Alert variant='primary' onClose={() => setCollectionTxResult({ hash: '', address: ''})} dismissible>
          <Alert.Heading>Minting contract transaction sent!</Alert.Heading>
          <p>
            There will be another transaction to register your collection, hang tight...
          </p>
          <p>
            Contract address:{' '}
            <Alert.Link
              href={`#/contract/${collectionTxResult.address}`}
              as={'a'} target='blank'>
              {collectionTxResult.address}
            </Alert.Link>
          </p>
          <p>
            View on Etherscan:{' '}
            <Alert.Link href={`https://etherscan.io/tx/${collectionTxResult.hash}`} as={'a'} target='blank'>
              {collectionTxResult.hash}
            </Alert.Link>
          </p>
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
          <Alert.Link href={`#/contract/${collectionTxResult.address}`} as={'a'}>
            {success}
          </Alert.Link> created successfully!
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
            <Form.Group as={Col} controlId='validationName'>
              <Form.Label>Collection name</Form.Label>
              <Form.Control
                required
                type='text'
                max={32}
                htmlSize={32}
                placeholder='Nice collection'
              />
              <Form.Text id='nameHelp' muted>
                Maximum of 32 characters
              </Form.Text>
              <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              <Form.Control.Feedback type='invalid'>
                Please enter a collection name.
              </Form.Control.Feedback>
            </Form.Group>
          </Row>
          <Button type='submit'>
            Create
          </Button>
        </Form>
      }
    </Container>
  )
}
