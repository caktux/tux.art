
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'

import { RegisterContractForm } from './RegisterContractForm'


export const RegisterContractModal = (props: any) => {
  return (
    <Modal show={props.show} onHide={props.handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Register a minting contract</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <RegisterContractForm setFetched={props.setFetched} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={props.handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
