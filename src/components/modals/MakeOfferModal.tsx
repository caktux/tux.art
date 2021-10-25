
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'

import { MakeOfferForm } from './MakeOfferForm'


export const MakeOfferModal = (props: any) => {

  return (
    <Modal show={props.show} onHide={props.handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Make an offer</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <MakeOfferForm
          offers={props.offers}
          setFetched={props.setFetched}
          setLoaded={props.setLoaded}
          tokenContract={props.tokenContract}
          tokenId={props.tokenId}
          tokenOwner={props.tokenOwner}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={props.handleClose}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
