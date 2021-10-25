
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'

import { AddCreatorForm } from './AddCreatorForm'


export const AddCreatorModal = (props: any) => {
  return (
    <Modal show={props.show} onHide={props.handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add a creator</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <AddCreatorForm
          houseId={props.houseId}
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
