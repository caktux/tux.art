
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

export const ApproveModal = (props: any) => {
  const { account, ethereum } = useWallet()

  const [ error, setError ] = useState(false as any)
  const [ pending, setPending ] = useState(false)
  const [ txResult, setTxResult ] = useState('')
  const [ success, setSuccess ] = useState('')

  const approveAuction = async (approved: boolean) => {
    setPending(true)

    const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
    const contract = new ethers.Contract(AUCTIONS, Auctions, signer as Signer)

    const tx = await contract.setAuctionApproval(props.auction.id, approved).catch((e: any) => {
      console.warn(`In setAuctionApproval`, e.data ? e.data.message : e.message)
      if (e.data && e.data.message)
        setError(e.data.message.slice(0, e.data.message.length - 1).slice(79, e.data.message.length))
      else
        setError(e.message)
    })

    if (tx && tx.hash) {
      setError(false)
      setTxResult(tx.hash)
      await tx.wait()
      setSuccess(`Successfully ${approved ? 'approved' : 'revoked approval for'} token #${props.auction.tokenId}!`)
    }

    setPending(false)
    props.setLoaded(false)
    props.setFetched(false)
  }

  return (
    <Modal show={props.show} onHide={props.handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Approve auction</Modal.Title>
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
        { !pending && !success && account !== props.auction.tokenOwner && props.auction.tokenOwner !== ethers.constants.AddressZero &&
          <>{ !props.auction.approved ? 'Approve' : 'Revoke approval of' } this auction?</>
        }
      </Modal.Body>
      <Modal.Footer>
        { !pending && !success && account !== props.auction.tokenOwner && props.auction.tokenOwner !== ethers.constants.AddressZero &&
          <>
            { !props.auction.approved ?
              <Button variant='success' onClick={() => approveAuction(true)}>
                Approve
              </Button> :
              <Button variant='danger' onClick={() => approveAuction(false)}>
                Revoke approval
              </Button>
            }
          </>
        }
        <Button variant='secondary' onClick={props.handleClose}>
          { success ? 'Close' : 'Cancel' }
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
