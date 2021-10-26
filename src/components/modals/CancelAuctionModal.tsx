
import { useState } from 'react'
import { useWallet } from 'use-wallet'

import Container from 'react-bootstrap/Container'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Modal from 'react-bootstrap/Modal'

import { ethers, Signer } from 'ethers'
import { Auctions } from '../../abi/Auctions'
import { AUCTIONS } from '../../constants/contracts'

export const CancelAuctionModal = (props: any) => {
  const { ethereum } = useWallet()

  const [ error, setError ] = useState(false as any)
  const [ pending, setPending ] = useState(false)
  const [ txResult, setTxResult ] = useState('')
  const [ success, setSuccess ] = useState('')

  const cancelAuction = async () => {
    setPending(true)

    const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
    const contract = new ethers.Contract(AUCTIONS, Auctions, signer as Signer)

    const tx = await contract.cancelAuction(props.auction.id).catch((e: any) => {
      console.warn(`In cancelAuction`, e.error ? e.error.message : e.message)
      if (e.error && e.error.message)
        setError(e.error.message.replace('execution reverted: ', ''))
      else
        setError(e.message)
    })

    if (tx && tx.hash) {
      setTxResult(tx.hash)
      await tx.wait()
      setSuccess(`Auction cancelled successfully!`)
    }

    setPending(false)
    props.setLoaded(false)
    props.setFetched(false)
  }

  return (
    <Modal show={props.show} onHide={props.handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Cancel auction</Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
          <>Are you sure you want to cancel this auction?</>
        }
      </Modal.Body>
      <Modal.Footer>
        { !pending && !success &&
          <>
            <Button variant='danger' onClick={cancelAuction}>
              Yes, cancel this auction
            </Button>
            <Button variant='secondary' onClick={props.handleClose}>
              Cancel
            </Button>
          </>
        }
        { success &&
          <Button variant='secondary' onClick={props.handleClose}>
            Close
          </Button>
        }
      </Modal.Footer>
    </Modal>
  )
}
