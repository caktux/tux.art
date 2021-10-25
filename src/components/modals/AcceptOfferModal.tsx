
import { useState, useEffect } from 'react'
import { useEthereum } from '../../hooks/ethereum'
import { useWallet } from 'use-wallet'

import Container from 'react-bootstrap/Container'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Modal from 'react-bootstrap/Modal'

import { ethers, Signer } from 'ethers'
import { ERC721 } from '../../abi/ERC721'
import { Auctions } from '../../abi/Auctions'
import { AUCTIONS } from '../../constants/contracts'

export const AcceptOfferModal = (props: any) => {
  const { provider } = useEthereum()
  const { account, ethereum } = useWallet()

  const [ error, setError ] = useState(false as any)
  const [ pending, setPending ] = useState(false)
  const [ txResult, setTxResult ] = useState('')
  const [ success, setSuccess ] = useState('')
  const [ approved, setApproved ] = useState(false)
  const [ checkedApproved, setCheckedApproved] = useState(false)


  const acceptOffer = async () => {
    setPending(true)

    const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
    const contract = new ethers.Contract(AUCTIONS, Auctions, signer as Signer)

    const tx = await contract.acceptOffer(props.offer.id).catch((e: any) => {
      console.warn(`In acceptOffer`, e.data ? e.data.message : e.message)
      if (e.data && e.data.message)
        setError(e.data.message.slice(0, e.data.message.length - 1).slice(79, e.data.message.length))
      else
        setError(e.message)
    })

    if (tx && tx.hash) {
      setError(false)
      setTxResult(tx.hash)
      await tx.wait()
      setSuccess(`Successfully accepted the offer!`)
    }

    setPending(false)

    props.setLoaded(false)
    props.setFetched(false)
  }

  const approveAuctions = async () => {
    setPending(true)

    const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
    const contract = new ethers.Contract(props.tokenContract, ERC721, signer as Signer)

    const tx = await contract.approve(AUCTIONS, props.tokenId).catch((e: any) => {
      console.warn(`In approve`, e.message)
      setError(e.message)
    })

    if (tx && tx.hash) {
      setTxResult(tx.hash)
      await tx.wait()
    }

    setCheckedApproved(false)
    setPending(false)
  }

  const approveAuctionsForAll = async () => {
    setPending(true)

    const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
    const contract = new ethers.Contract(props.tokenContract, ERC721, signer as Signer)

    const tx = await contract.setApprovalForAll(AUCTIONS, true).catch((e: any) => {
      console.warn(`In setApprovalForAll`, e.message)
      setError(e.message)
    })

    if (tx && tx.hash) {
      setTxResult(tx.hash)
      await tx.wait()
    }

    setCheckedApproved(false)
    setPending(false)
  }

  useEffect(() => {
    const checkApproved = async () => {
      if (checkedApproved || !account)
        return
      setCheckedApproved(true)

      const contract = new ethers.Contract(props.tokenContract, ERC721, provider)

      const approvedAddress = await contract.getApproved(props.tokenId).catch((e: any) => {
        console.warn(`In getApproved`, e.message)
      })
      if (approvedAddress === AUCTIONS)
        setApproved(true)

      const isApprovedForAll = await contract.isApprovedForAll(account, AUCTIONS).catch((e: any) => {
        console.warn(`In isApprovedForAll`, e.message)
      })
      if (isApprovedForAll)
        setApproved(true)
    }
    checkApproved()
  })

  return (
    <Modal show={props.show} onHide={props.handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Accept offer</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        { error &&
          <Alert variant='danger' onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        }
        { txResult &&
          <Alert variant='primary' onClose={() => setTxResult('')} dismissible>
            <Alert.Heading>Transaction sent!</Alert.Heading>
            <p>
              View on Etherscan:{' '}
              <Alert.Link href={`https://etherscan.io/tx/${txResult}`} as={'a'} target='blank'>
                {txResult}
              </Alert.Link>
            </p>
          </Alert>
        }
        { success &&
          <Alert variant='success' onClose={() => setSuccess('')} dismissible>
            {success}
          </Alert>
        }
        { pending &&
          <Container className='text-center'>
            <Spinner animation='grow' role='status' />
          </Container>
        }
        { !approved && !pending &&
          <Alert variant='danger'>
            <p className='text-center'>
              The auction contract needs to be approved to transfer this token from your account{' '}
              to the contract itself.
            </p>
            <div className='d-grid gap-2'>
              <Button onClick={approveAuctions} size='lg'>
                Approve for this token only
              </Button>
              <Button onClick={approveAuctionsForAll} size='lg'>
                Approve for all tokens
              </Button>
            </div>
          </Alert>
        }
        { approved && !pending && !success && account !== props.offer.from &&
          <>Are you sure you want to accept this offer?</>
        }
      </Modal.Body>
      <Modal.Footer>
        { !pending && !success && account !== props.offer.from &&
          <>
            { approved &&
              <Button variant='primary' onClick={acceptOffer}>
                Yes, accept the offer
              </Button> }
            <Button variant='secondary' onClick={props.handleClose}>
              Cancel
            </Button>
          </>
        }
        { (success || account === props.offer.from) &&
          <Button variant='secondary' onClick={props.handleClose}>
            Close
          </Button>
        }
      </Modal.Footer>
    </Modal>
  )
}
