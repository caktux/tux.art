
import { useState } from 'react'
import { useWallet } from 'use-wallet'

import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'

import { PlaceBidForm } from './PlaceBidForm'


export const PlaceBidModal = (props: any) => {
  const { account } = useWallet()

  const [ hasTxResult, setHasTxResult ] = useState(false)

  return (
    <Modal show={props.show} onHide={props.handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          { props.isAuction ?
            'Place a bid' : 'Buy now' }
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <PlaceBidForm
          auction={props.auction}
          isAuction={props.isAuction}
          setFetched={props.setFetched}
          setLoaded={props.setLoaded}
          tokenContract={props.tokenContract}
          tokenId={props.tokenId}
          tokenOwner={props.tokenOwner}
          setHasTxResult={setHasTxResult}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={props.handleClose}>
          { props.auction.bidder === account || hasTxResult ? 'Close' : 'Cancel' }
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
