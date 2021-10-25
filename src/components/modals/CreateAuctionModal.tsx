
import { useWallet } from 'use-wallet'

import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'

import { CreateAuctionForm } from './CreateAuctionForm'


export const CreateAuctionModal = (props: any) => {
  const { account } = useWallet()

  return (
    <Modal show={props.show} onHide={props.handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Start an auction</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <CreateAuctionForm
          auction={props.auction}
          setFetched={props.setFetched}
          setLoaded={props.setLoaded}
          tokenContract={props.tokenContract}
          tokenId={props.tokenId}
          tokenOwner={props.tokenOwner}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={props.handleClose}>
          { props.tokenOwner !== account ? 'Close' : 'Cancel' }
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
