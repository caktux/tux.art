
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'

import { UpdateReservePriceForm } from './UpdateReservePriceForm'


export const UpdateReservePriceModal = (props: any) => {
  return (
    <Modal show={props.show} onHide={props.handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Update reserve price</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <UpdateReservePriceForm
          auction={props.auction}
          setFetched={props.setFetched}
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
