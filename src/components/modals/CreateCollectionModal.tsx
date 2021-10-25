
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'

import { CreateCollectionForm } from './CreateCollectionForm'


export const CreateCollectionModal = (props: any) => {
  return (
    <Modal size='lg' show={props.show} onHide={props.handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create a collection</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <CreateCollectionForm setFetched={props.setFetched} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={props.handleClose}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
