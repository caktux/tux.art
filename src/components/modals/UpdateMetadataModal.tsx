
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'

import { UpdateMetadataForm } from './UpdateMetadataForm'


export const UpdateMetadataModal = (props: any) => {
  return (
    <Modal show={props.show} onHide={props.handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Update metadata</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <UpdateMetadataForm
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
