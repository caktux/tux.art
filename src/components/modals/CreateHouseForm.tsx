
import { useState } from 'react'
import { useWallet } from 'use-wallet'

import { Link } from 'react-router-dom'

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


export const CreateHouseForm = (props: any) => {
  const { account, ethereum } = useWallet()

  const [ error, setError ] = useState(false as any)
  const [ validated, setValidated ] = useState(false)
  const [ curatorInvalid, setCuratorInvalid ] = useState(false)
  // const [ requireApproval, setRequireApproval ] = useState(false)
  const [ pending, setPending ] = useState(false)
  const [ txResult, setTxResult ] = useState('')
  const [ success, setSuccess ] = useState([] as any)


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
        const contract = new ethers.Contract(AUCTIONS, Auctions, signer as Signer)

        const fee = event.target[2].value ? parseFloat(event.target[2].value) * 100 : 0

        const tx = await contract.createHouse(
          event.target[0].value, // Name
          event.target[1].value, // Curator
          Math.floor(fee), // Fee %
          event.target[4].checked ? false : true, // per-auction approval
          event.target[3].value // Metadata
        ).catch((e: any) => {
          console.warn(`In createHouse`, e.data ? e.data.message : e.message)
          if (e.data && e.data.message)
            setError(e.data.message)
          else
            setError(e.message)
        })

        if (tx && tx.hash) {
          setError(false)
          setTxResult(tx.hash)
          const receipt = await tx.wait()
          const txLog = contract.interface.parseLog(receipt.events[1])
          setSuccess([txLog.args.houseId.toString(), event.target[0].value])
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
      if (event.target.id === 'validationCurator' &&
          !ethers.utils.isAddress(event.target.value)) {
        setCuratorInvalid(true)
        setValidated(false)
        return
      }
      setCuratorInvalid(false)
      setValidated(true)
      setError(false)
      setTxResult('')
      setSuccess([])
    }
  }

  // const handleRequireApproval = (event: any) => {
  //   console.log(event.currentTarget.checked)
  //   event.preventDefault()
  //   setRequireApproval(event.currentTarget.checked)
  // }

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
      { success && success.length > 0 &&
        <Alert variant='success' onClose={() => setSuccess('')} dismissible>
          <Link to={`/house/${success[0]}`}>
            {success[1]}
          </Link> created successfully!
          Add creators to it in <Link to={`/account/houses`}>
            your account
          </Link>
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
              <Form.Label>House name</Form.Label>
              <Form.Control
                required
                type='text'
                max={32}
                htmlSize={32}
                placeholder='Nice house'
              />
              <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              <Form.Control.Feedback type='invalid'>
                Please enter a house name.
              </Form.Control.Feedback>
            </Form.Group>
          </Row>
          <Row className='mb-3'>
            <Form.Group as={Col} controlId='validationCurator'>
              <Form.Label>Curator's address</Form.Label>
              <Form.Control
                required
                type='text'
                placeholder='0x...'
                max={42}
                htmlSize={42}
                isInvalid={curatorInvalid}
                pattern='^0x[a-fA-F0-9]{40}'
              />
              <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              <Form.Control.Feedback type='invalid'>
                Please enter a valid address.
              </Form.Control.Feedback>
            </Form.Group>
          </Row>
          <Row className='mb-3'>
            <Form.Group as={Col} controlId='validationFee'>
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
                <Form.Control.Feedback type='invalid'>
                  Please enter a valid number.
                </Form.Control.Feedback>
              </InputGroup>
            </Form.Group>
          </Row>
          <Row className='mb-3'>
            <Form.Group as={Col} controlId='validationMetadata'>
              <Form.Label>Metadata IPFS or IPNS hash</Form.Label>
              <Form.Control
                type='text'
                max={46}
                htmlSize={46}
                pattern='^Qm[1-9A-Za-z]{44}'
                placeholder='Qm...'
              />
              <Form.Text id='metadataHelp' muted>
                Optional metadata in JSON format (logo, featured creators, pieces, links){' '}
                <span className='text-warning'>not implemented yet</span>
              </Form.Text>
              <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              <Form.Control.Feedback type='invalid'>
                Please enter valid IPFS CIDv0 hash.
              </Form.Control.Feedback>
            </Form.Group>
          </Row>
          <Row className='mb-3'>
            <Form.Group as={Col} controlId='validationPreApproval'>
              <Form.Check label='Require per-auction approval' />
              <Form.Text id='preApprovedHelp' muted>
                Every auction will need to be approved if this option is checked.
              </Form.Text>
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
