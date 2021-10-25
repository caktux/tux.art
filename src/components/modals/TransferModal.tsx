
import { useWallet } from 'use-wallet'

import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'

import { TransferForm } from './TransferForm'


export const TransferModal = (props: any) => {
  const { account } = useWallet()

  return (
    <Modal show={props.show} onHide={props.handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Transfer NFT</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <TransferForm
          token={props.token}
          setFetched={props.setFetched}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={props.handleClose}>
          { props.token.props.owner !== account ? 'Close' : 'Cancel' }
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
