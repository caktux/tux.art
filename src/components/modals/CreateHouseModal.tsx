
// import { useState } from 'react'

import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'

import { CreateHouseForm } from './CreateHouseForm'


export const CreateHouseModal = (props: any) => {
  return (
    <Modal size='lg' show={props.show} onHide={props.handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create a house</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <CreateHouseForm setFetched={props.setFetched} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={props.handleClose}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
