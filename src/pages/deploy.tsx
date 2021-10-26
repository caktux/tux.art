
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
import { TuxFull } from '../abi/TuxFull'
import { TuxERC20Full } from '../abi/TuxERC20Full'
import { AuctionsFull } from '../abi/AuctionsFull'
// import { AUCTIONS, TUX } from '../constants/contracts'


export default function Deploy(props: any) {
  const { account, ethereum } = useWallet()

  const [ error, setError ] = useState(false as any)
  const [ pending, setPending ] = useState(false)
  const [ validated, setValidated ] = useState(false)
  const [ auctionsTxResult, setAuctionsTxResult ] = useState({ hash: '', address: ''})
  const [ tuxERC20TxResult, setTuxERC20TxResult ] = useState({ hash: '', address: ''})
  const [ tuxTxResult, setTuxTxResult ] = useState({ hash: '', address: ''})
  const [ createHouseTxResult, setCreateHouseTxResult ] = useState('')
  const [ registerTxResult, setRegisterTxResult ] = useState('')
  const [ successRegister, setSuccessRegister ] = useState('')
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

      const deploy = async () => {
        const signer = new ethers.providers.Web3Provider(ethereum).getSigner()

        const tux = new ethers.ContractFactory(TuxFull.abi, TuxFull.bytecode, signer as Signer)
        const tuxERC20 = new ethers.ContractFactory(TuxERC20Full.abi, TuxERC20Full.bytecode, signer as Signer)
        const auctions = new ethers.ContractFactory(AuctionsFull.abi, AuctionsFull.bytecode, signer as Signer)

        let tuxContract = null as any
        let tuxERC20Contract = null as any
        let auctionsContract = null as any

        const name = event.target[0].value
        const symbol = event.target[1].value

        try {
          tuxContract = await tux.deploy(name, symbol)
          setTuxTxResult({
            hash: tuxContract.deployTransaction.hash,
            address: tuxContract.address
          })
          await tuxContract.deployed()
        } catch (e: any) {
          console.warn(`In tux.deploy`, e.error ? e.error.message : e.message)
          if (e.error && e.error.message)
            setError(e.error.message.replace('execution reverted: ', ''))
          else
            setError(e.message)
          setPending(false)
          return
        }

        try {
          tuxERC20Contract = await tuxERC20.deploy(name, symbol)
          setTuxERC20TxResult({
            hash: tuxERC20Contract.deployTransaction.hash,
            address: tuxERC20Contract.address
          })
          await tuxERC20Contract.deployed()
        } catch (e: any) {
          console.warn(`In tuxERC20.deploy`, e.error ? e.error.message : e.message)
          if (e.error && e.error.message)
            setError(e.error.message.replace('execution reverted: ', ''))
          else
            setError(e.message)
          setPending(false)
          return
        }

        try {
          auctionsContract = await auctions.deploy(tuxERC20Contract.address)
          setAuctionsTxResult({
            hash: auctionsContract.deployTransaction.hash,
            address: auctionsContract.address
          })
          await auctionsContract.deployed()
        } catch (e: any) {
          console.warn(`In auctions.deploy`, e.error ? e.error.message : e.message)
          if (e.error && e.error.message)
            setError(e.error.message.replace('execution reverted: ', ''))
          else
            setError(e.message)
          setPending(false)
          return
        }

        const txMinter = await tuxERC20Contract.setMinter(auctionsContract.address).catch((e: any) => {
          console.warn(`In tuxERC20Contract.setMinter`, e.error ? e.error.message : e.message)
          if (e.error && e.error.message)
            setError(e.error.message.replace('execution reverted: ', ''))
          else
            setError(e.message)
          setPending(false)
          return
        })
        await txMinter.wait()

        // const contract = new ethers.Contract(AUCTIONS, AuctionsFull.abi, signer as Signer)
        const contract = new ethers.Contract(auctionsContract.address, AuctionsFull.abi, signer as Signer)
        const tx = await contract.createHouse(
          name, // Name
          account, // Curator
          0, // Fee % * 100
          true, // Pre-approved
          '' // Metadata hash
        ).catch((e: any) => {
          console.warn(`In contract.createHouse`, e.error ? e.error.message : e.message)
          if (e.error && e.error.message)
            setError(e.error.message.replace('execution reverted: ', ''))
          else
            setError(e.message)
          setPending(false)
          return
        })

        if (tx && tx.hash) {
          setCreateHouseTxResult(tx.hash)
          await tx.wait()
          setSuccess(name)
        }

        // const txRegister = await contract.registerTokenContract(TUX).catch((e: any) => {
        const txRegister = await contract.registerTokenContract(tuxContract.address).catch((e: any) => {
          console.warn(`In contract.registerTokenContract`, e.error ? e.error.message : e.message)
          if (e.error && e.error.message)
            setError(e.error.message.replace('execution reverted: ', ''))
          else
            setError(e.message)
          setPending(false)
          return
        })

        if (txRegister && txRegister.hash) {
          setRegisterTxResult(txRegister.hash)
          await txRegister.wait()
          setSuccessRegister(name)
        }

        setPending(false)
      }
      deploy()
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
        This will deploy the auctions contract as well as the Tux minting contract,
        the TUX token contract (ERC20), set the ERC20 minting address to the
        auctions contract, add a house of the same name, and
        register the minting contract.
      </Alert>

      { error &&
        <Alert variant='danger' onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      }

      { auctionsTxResult.hash &&
        <Alert variant='primary' onClose={() => setAuctionsTxResult({ hash: '', address: ''})} dismissible>
          <Alert.Heading>Auctions contract transaction sent!</Alert.Heading>
          <p>
            Contract address: { auctionsTxResult.address }
          </p>
          <p>
            View on Etherscan:{' '}
            <Alert.Link href={`https://etherscan.io/tx/${auctionsTxResult.hash}`} as={'a'} target='blank'>
              {auctionsTxResult.hash}
            </Alert.Link>
          </p>
        </Alert>
      }

      { tuxTxResult.hash &&
        <Alert variant='primary' onClose={() => setTuxTxResult({ hash: '', address: ''})} dismissible>
          <Alert.Heading>Minting contract transaction sent!</Alert.Heading>
          <p>
            Contract address: { tuxTxResult.address }
          </p>
          <p>
            View on Etherscan:{' '}
            <Alert.Link href={`https://etherscan.io/tx/${tuxTxResult.hash}`} as={'a'} target='blank'>
              {tuxTxResult.hash}
            </Alert.Link>
          </p>
        </Alert>
      }

      { tuxERC20TxResult.hash &&
        <Alert variant='primary' onClose={() => setTuxERC20TxResult({ hash: '', address: ''})} dismissible>
          <Alert.Heading>TUX contract transaction sent!</Alert.Heading>
          <p>
            Contract address: { tuxERC20TxResult.address }
          </p>
          <p>
            View on Etherscan:{' '}
            <Alert.Link href={`https://etherscan.io/tx/${tuxTxResult.hash}`} as={'a'} target='blank'>
              {tuxTxResult.hash}
            </Alert.Link>
          </p>
        </Alert>
      }

      { createHouseTxResult &&
        <Alert variant='primary' onClose={() => setCreateHouseTxResult('')} dismissible>
          <Alert.Heading>House creation transaction sent!</Alert.Heading>
          <p>
            View on Etherscan:{' '}
            <Alert.Link href={`https://etherscan.io/tx/${createHouseTxResult}`} as={'a'} target='blank'>
              {createHouseTxResult}
            </Alert.Link>
          </p>
        </Alert>
      }

      { registerTxResult &&
        <Alert variant='primary' onClose={() => setRegisterTxResult('')} dismissible>
          <Alert.Heading>Minting contract registration transaction sent!</Alert.Heading>
          <p>
            View on Etherscan:{' '}
            <Alert.Link href={`https://etherscan.io/tx/${registerTxResult}`} as={'a'} target='blank'>
              {registerTxResult}
            </Alert.Link>
          </p>
        </Alert>
      }

      { success &&
        <Alert variant='success' onClose={() => setSuccess('')} dismissible>
          { success } deployed successfully!
        </Alert>
      }
      { successRegister &&
        <Alert variant='success' onClose={() => setSuccessRegister('')} dismissible>
          { successRegister } registered successfully!
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
              <Form.Label>Name</Form.Label>
              <Form.Control
                required
                type='text'
                defaultValue='Tux'
                max={32}
                placeholder='Tux'
              />
              <Form.Text id='nameHelp' muted>
                Maximum of 32 characters
              </Form.Text>
              <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              <Form.Control.Feedback type='invalid'>
                Please enter a minting contract name.
              </Form.Control.Feedback>
            </Form.Group>
          </Row>
          <Row className='mb-3'>
            <Form.Group as={Col} controlId='validationSymbol'>
              <Form.Label>Symbol</Form.Label>
              <Form.Control
                required
                type='text'
                defaultValue='TUX'
                min={3}
                max={5}
                placeholder='TUX'
              />
              <Form.Text id='symbolHelp' muted>
                Maximum of 5 characters
              </Form.Text>
              <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              <Form.Control.Feedback type='invalid'>
                Please enter a minting contract symbol.
              </Form.Control.Feedback>
            </Form.Group>
          </Row>
          <Button type='submit'>
            Deploy
          </Button>
        </Form>
      }
    </Container>
  )
}
