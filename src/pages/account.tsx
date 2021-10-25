
import { useState, useEffect, useRef } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useEthereum } from '../hooks/ethereum'
import { useIPFS } from '../hooks/ipfs'
import { useWallet } from 'use-wallet'

import FloatingLabel from 'react-bootstrap/FloatingLabel'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Container from 'react-bootstrap/Container'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Image from 'react-bootstrap/Image'
import Form from 'react-bootstrap/Form'
import Card from 'react-bootstrap/Card'
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import OwnedList from '../components/OwnedList'
import CreatedList from '../components/CreatedList'
import CuratorHouses from '../components/CuratorHouses'
import CreatorHouses from '../components/CreatorHouses'
import SellerAuctions from '../components/SellerAuctions'
import BidderAuctions from '../components/BidderAuctions'

import { CreateHouseModal } from '../components/modals/CreateHouseModal'

import { ethers, Signer, BigNumber } from 'ethers'
import { Auctions } from '../abi/Auctions'
import { TuxERC20 } from '../abi/TuxERC20'
import { AUCTIONS, TUXTOKEN } from '../constants/contracts'

import { NFTSTORAGE_KEY } from '../utils/nfts'
import { NFTStorage, File } from 'nft.storage'

import TokenAmount from 'token-amount'

import { getRankedContracts } from '../fetchers/contracts'
import { shortAddress } from '../utils/nfts'

import { fetchWithTimeout } from '../utils/ipfs'


export default function Account(props: any) {
  const { account, ethereum } = useWallet()
  const { ipfs, ipfsHost } = useIPFS()
  const { provider } = useEthereum()

  const history = useHistory()
  const params = useParams<any>()

  const mounted = useRef(true)

  const [ offset, setOffset ] = useState(0)
  const [ offsets, setOffsets ] = useState({ 0: ethers.constants.AddressZero} as any)
  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ contracts, setContracts ] = useState([])
  const [ backDisabled, setBackDisabled ] = useState(true)
  const [ forwardDisabled, setForwardDisabled ] = useState(true)

  const [ address, setAddress ] = useState('')
  const [ showAddress, setShowAddress ] = useState('')
  const [ resolved, setResolved] = useState(false)
  const [ accountFetched, setAccountFetched] = useState(false)
  const [ tuxAccount, setTuxAccount] = useState({} as any)
  const [ showCreateHouse, setShowCreateHouse] = useState(false)

  const [ balance, setBalance ] = useState(BigNumber.from(0))
  const [ balanceFetched, setBalanceFetched ] = useState(false)

  const [ name, setName ] = useState('')
  const [ bio, setBio ] = useState('')
  const [ imageHash, setImageHash ] = useState('')
  const [ bioHash, setBioHash ] = useState('')
  const [ pending, setPending ] = useState(false)
  const [ error, setError ] = useState(false as any)
  const [ txResult, setTxResult ] = useState('' as any)
  const [ success, setSuccess ] = useState('' as any)
  const [ tab, setTab ] = useState(params.tab ? params.tab : 'auctions')

  const client = new NFTStorage({ token: NFTSTORAGE_KEY })

  const handleShowCreateHouse = () => setShowCreateHouse(true)
  const handleCloseCreateHouse = () => setShowCreateHouse(false)

  const handleChangeTab = (key: string | null) => {
    if (!mounted.current)
      return

    setTab(key)

    history.push(`/account/${key}`)
  }

  const handleChangeName = (event: any) => {
    setName(event.currentTarget.value)
  }

  const handleChangeBio = (event: any) => {
    setBio(event.currentTarget.value)
  }

  const handleThemeSwitch = (event: any) => {
    localStorage.setItem('theme', event.currentTarget.value)
    window.location.reload()
  }

  const handleBack = () => {
    setOffset((offset) => { return offset - props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
    setLoaded(false)
    setContracts([])
  }

  const handleForward = () => {
    setOffset((offset) => { return offset + props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
    setLoaded(false)
    setContracts([])
  }

  const refresh = () => {
    if (!mounted.current)
      return
    setResolved(false)
    setFetched(false)
    setLoaded(false)
  }

  const updateContracts = (contracts: any, total: number) => {
    if (!mounted.current)
      return

    setContracts(contracts)

    if (backDisabled && offset >= props.limit)
      setBackDisabled(false)
    else if (!backDisabled && offset < props.limit)
      setBackDisabled(true)
    if (forwardDisabled && offset + props.limit < total)
      setForwardDisabled(false)
    else if (!forwardDisabled && offset + props.limit >= total)
      setForwardDisabled(true)

    setLoaded(true)
  }

  const updateName = async (event: any) => {
    event.preventDefault()

    if (!name) {
      setError('Please choose a display name')
      return
    }

    setPending(true)

    try {
      const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
      const contract = new ethers.Contract(AUCTIONS, Auctions, signer as Signer)

      const tx = await contract.updateName(name).catch((e: any) => {
        console.warn(`In contract.updateName`, e.data ? e.data.message : e.message)
        if (e.data && e.data.message)
          setError(e.data.message)
        else
          setError(e.message)
      })

      if (tx && tx.hash) {
        setError(false)
        setTxResult(tx.hash)
        await tx.wait()
        setSuccess('Display name updated successfully!')
        refresh()
      }
    } catch(e: any) {
      console.warn(`Updating name`, e.data ? e.data.message : e.message)
      if (e.data && e.data.message)
        setError(e.data.message)
      else
        setError(e.message)
    }
    setPending(false)
  }

  const updateBio = async (event: any) => {
    event.preventDefault()

    if (!bio) {
      setError('Please enter a bio')
      return
    }

    setPending(true)

    try {
      if (ipfs)
        await ipfs.add(bio, { cidVersion: 1 })

      const cid = await client.storeBlob(new Blob([bio], { type: 'application/json' }))
      await client.check(cid)

      setBioHash(cid)

      const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
      const contract = new ethers.Contract(AUCTIONS, Auctions, signer as Signer)

      const tx = await contract.updateBio(cid).catch((e: any) => {
        console.warn(`In contract.updateBio`, e.data ? e.data.message : e.message)
        if (e.data && e.data.message)
          setError(e.data.message)
        else
          setError(e.message)
      })

      if (tx && tx.hash) {
        setError(false)
        setTxResult(tx.hash)
        await tx.wait()
        setSuccess('Bio updated successfully!')
        refresh()
      }
    } catch(e: any) {
      console.warn(`Updating bio`, e.data ? e.data.message : e.message)
      if (e.data && e.data.message)
        setError(e.data.message)
      else
        setError(e.message)
    }
    setPending(false)
  }

  const updateImage = async (event:any) => {
    event.stopPropagation()
    event.preventDefault()

    setPending(true)

    try {
      const file = event.target.form[0].files[0]

      if (!file) {
        setError('Please choose a file')
        setPending(false)
        return
      }

      if (ipfs)
        await ipfs.add(file, { cidVersion: 1 })

      const cid = await client.storeBlob(new File([file], '', { type: file.type }))
      await client.check(cid)

      setImageHash(cid)

      const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
      const contract = new ethers.Contract(AUCTIONS, Auctions, signer as Signer)

      const tx = await contract.updatePicture(cid).catch((e: any) => {
        console.warn(`In contract.updatePicture`, e.data ? e.data.message : e.message)
        if (e.data && e.data.message)
          setError(e.data.message)
        else
          setError(e.message)
      })

      if (tx && tx.hash) {
        setError(false)
        setTxResult(tx.hash)
        await tx.wait()
        setSuccess('Profile picture updated successfully!')
        refresh()
      }
    } catch (e: any) {
      console.error(e.message)
      setError(e.message)
    }
    setPending(false)
  }

  useEffect(() => {
    if (account && !address) {
      if (!mounted.current)
        return
      setAddress(account)
      refresh()
    }
  }, [address, account])

  useEffect(() => {
    const formatAddress = async () => {
      if (resolved || !address || !provider || !mounted.current)
        return
      setResolved(true)

      const displayAddress = await shortAddress(address, provider)

      if (!mounted.current)
        return

      setShowAddress(displayAddress)
    }
    formatAddress()
  })

  useEffect(() => {
    const fetchAccount = async () => {
      if (accountFetched || !address || !provider || !mounted.current)
        return
      setAccountFetched(true)

      const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

      const fullAccount = await contract.accounts(address).catch((e: any) => {
        console.warn(`In contract.accounts`, e.message)
      })

      let bio = ''

      try {
        if (fullAccount && fullAccount.bioHash) {
          const response = await fetchWithTimeout(`${ipfsHost}/ipfs/${fullAccount.bioHash}`)
          bio = await response.text()
        }
      } catch (e: any) {}

      if (!mounted.current)
        return

      setTuxAccount({ bio: bio, ...fullAccount})
    }
    fetchAccount()
  })

  useEffect(() => {
    const fetchBalance = async () => {
      if (balanceFetched || !address || !provider || !mounted.current)
        return
      setBalanceFetched(true)

      const contract = new ethers.Contract(TUXTOKEN, TuxERC20, provider)

      const balance = await contract.balanceOf(address).catch((e: any) => {
        console.warn(`In contract.balanceOf`, e.message)
      })

      if (!mounted.current)
        return

      setBalance(balance)
    }
    fetchBalance()
  })

  useEffect(() => {
    const fetchContracts = async () => {
      if (fetched || !mounted.current)
        return
      setFetched(true)

      const [total, contracts] = await getRankedContracts(provider, props.limit, offsets[offset])

      if (!mounted.current)
        return

      if (!contracts || contracts.length === 0) {
        setLoaded(true)
        return
      }

      offsets[offset + props.limit] = contracts[contracts.length - 1].tokenContract
      setOffsets(offsets)

      updateContracts(contracts ? contracts : [], total)
    }
    fetchContracts()
  })

  useEffect(() => {
    if (!mounted.current)
      return

    const paramsTab = params.tab ? params.tab : 'auctions'

    if (paramsTab === tab)
      return

    setTab(paramsTab)
  }, [params.tab, tab])

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <Container fluid>
      <Row className='my-5'>
        { tuxAccount.pictureHash &&
          <Col xs={4} lg={2} xxl={1}>
            <Image className='profilePicture' src={`${ipfsHost}/ipfs/${tuxAccount.pictureHash}`} roundedCircle />
          </Col>
        }
        <Col xs={tuxAccount.pictureHash ? 8 : 12} lg={tuxAccount.pictureHash ? 6 : 8} xxl={tuxAccount.pictureHash ? 7 : 8}>
          <h3>
            { showAddress }
          </h3>
          { tuxAccount.bio &&
            <h5 className='text-muted'>
                { tuxAccount.bio }
            </h5>
          }
        </Col>
        <Col xs={12} lg={4} className='text-end'>
          <span className='lead me-3'>
            {
              TokenAmount.format(balance, 18, {
                symbol: 'TUX',
                digits: 5,
                commify: true
              })
            }
          </span>
          { account &&
            <Button className='account-button' onClick={() => props.resetWallet()}>Disconnect</Button>
          }
        </Col>
      </Row>

      <Tabs activeKey={tab} onSelect={(key) => handleChangeTab(key)} mountOnEnter={true}>
        <Tab eventKey='auctions' title='Auctions'>
          <SellerAuctions address={address} limit={4} />
          <BidderAuctions address={address} limit={4} />
        </Tab>

        <Tab eventKey='houses' title='Houses'>
          <Container fluid='lg'>
              <Row>
                <Col xs={6}>
                  <h4 className='my-5'>Houses as curator</h4>
                </Col>
                <Col xs={6} className='text-end'>
                  { account ?
                    <Button onClick={handleShowCreateHouse} className='header-button'>
                      Create a house
                    </Button> : '' }
                </Col>
              </Row>
              <CuratorHouses address={address} />
          </Container>

          <Container fluid='lg'>
            <Row>
              <Col xs={12}>
                <h4 className='my-5'>Houses as creator</h4>
              </Col>
            </Row>
            <CreatorHouses address={address} />
          </Container>
        </Tab>

        <Tab eventKey='owned' title='Owned'>
          <Container fluid className='mt-3 mb-2'>
            <Row xs={1}>
              <Card.Header>
                <Row xs={1}>
                  <Col xs={8} className='vertical-align'>
                    All collections
                  </Col>
                  <Col xs={4} className='text-end'>
                    <ButtonGroup>
                      <Button
                        size='sm'
                        onClick={handleBack}
                        disabled={backDisabled}>{'←'}</Button>
                      <Button
                        size='sm'
                        onClick={handleForward}
                        disabled={forwardDisabled}>{'→'}</Button>
                    </ButtonGroup>
                  </Col>
                </Row>
              </Card.Header>
            </Row>
          </Container>
          { contracts && contracts.length > 0 &&
            contracts.map((contract: any, index: number) => {
              return (
                <Row xs={1} key={`platform-${index}`} className='mb-3'>
                  <OwnedList
                    limit={4}
                    account={address}
                    contract={contract}
                  />
                </Row>
              )
            })
          }
          { !loaded &&
            <Alert variant='dark' className='text-center'>
              <Spinner animation='grow' role='status' />
            </Alert>
          }
          { loaded && contracts.length === 0 &&
            <Alert variant='dark' className='text-center'>
              No token contracts could be found
            </Alert>
          }
        </Tab>

        <Tab eventKey='created' title='Created'>
          <Container fluid className='mt-3 mb-2'>
            <Row xs={1}>
              <Card.Header>
                <Row xs={1}>
                  <Col xs={8} className='vertical-align'>
                    All collections
                  </Col>
                  <Col xs={4} className='text-end'>
                    <ButtonGroup>
                      <Button
                        size='sm'
                        onClick={handleBack}
                        disabled={backDisabled}>{'←'}</Button>
                      <Button
                        size='sm'
                        onClick={handleForward}
                        disabled={forwardDisabled}>{'→'}</Button>
                    </ButtonGroup>
                  </Col>
                </Row>
              </Card.Header>
            </Row>
          </Container>
          { contracts && contracts.length > 0 &&
            contracts.map((contract: any, index: number) => {
              return (
                <Row xs={1} key={`created-${index}`} className='mb-3'>
                  <CreatedList
                    limit={4}
                    account={address}
                    contract={contract}
                  />
                </Row>
              )
            })
          }
          { !loaded &&
            <Alert variant='dark' className='text-center'>
              <Spinner animation='grow' role='status' />
            </Alert>
          }
          { loaded && contracts.length === 0 &&
            <Alert variant='dark' className='text-center'>
              No token contracts could be found
            </Alert>
          }
        </Tab>

        <Tab eventKey='settings' title='Settings'>
          <Container fluid='lg' className='mt-3'>
            { error &&
              <Alert variant='danger' onClose={() => setError('')} dismissible>
                {error}
              </Alert>
            }
            { pending &&
              <Container className='text-center mb-3'>
                <Spinner animation='grow' role='status' />
              </Container>
            }
            { success &&
              <Alert variant='success' onClose={() => setSuccess('')} dismissible>
                {success}
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
            { bioHash &&
              <Alert variant='primary'>
                <p>
                  Bio IPFS hash: <code className='imageHash'>{bioHash}</code>
                </p>
                <a target='_blank' rel='noreferrer' href={'ipfs://' + bioHash}>
                  {'ipfs://' + bioHash}
                </a>
              </Alert>
            }
            { imageHash &&
              <Alert variant='primary'>
                <p>
                  Profile picture IPFS hash: <code className='imageHash'>{imageHash}</code>
                </p>
                <a target='_blank' rel='noreferrer' href={'ipfs://' + imageHash}>
                  {'ipfs://' + imageHash}
                </a>
              </Alert>
            }

            <Row xs={1} md={2} className='mb-3'>
              <Col>
                <Form noValidate onSubmit={updateName} className='mb-3'>
                  <Row className='mb-3'>
                    <Form.Group as={Col} controlId='validationName'>
                      <Form.Label>Display name</Form.Label>
                      <Form.Control
                        type='text'
                        placeholder='Display name'
                        onChange={handleChangeName}
                      />
                      <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                    </Form.Group>
                  </Row>
                  <Row className='mb-3'>
                    <Container>
                      <Button type='submit' disabled={!ethereum}>
                        Update name
                      </Button>
                    </Container>
                  </Row>
                </Form>

                <Form noValidate onSubmit={updateBio} className='mb-3'>
                  <Row className='mb-3'>
                    <Form.Group as={Col} controlId='validationBio'>
                      <Form.Label>Bio</Form.Label>
                      <Form.Control
                        type='text'
                        as='textarea'
                        style={{ height: '7rem' }}
                        placeholder='Bio'
                        onChange={handleChangeBio}
                      />
                      <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                    </Form.Group>
                  </Row>
                  <Row className='mb-3'>
                    <Container>
                      <Button type='submit' disabled={!ethereum}>
                        Update bio
                      </Button>
                    </Container>
                  </Row>
                </Form>
              </Col>

              <Col>
                <Form>
                  { !imageHash ?
                    <>
                      <Row className='mb-3'>
                        <Form.Group controlId='formImage'>
                          <Form.Label>Select a profile picture</Form.Label>
                          <Form.Control type='file' />
                        </Form.Group>
                      </Row>
                      <div className='d-grid gap-2'>
                        <Button type='submit' disabled={pending} onClick={updateImage}>
                          { pending ?
                            <Spinner size='sm' animation='grow' role='status' /> :
                            'Update profile picture' }
                        </Button>
                      </div>
                    </> : ''
                  }
                  { imageHash &&
                    <Container className='text-center'>
                      <Button variant='success' size='lg' disabled>✓</Button>
                    </Container>
                  }
                </Form>

                <Row className='mt-5'>
                  <Col>
                    <FloatingLabel label='Theme'>
                      <Form.Select aria-label='Theme' onChange={handleThemeSwitch} defaultValue={localStorage.getItem('theme') as string}>
                        <option value='darkly'>Darkly</option>
                        <option value='lux'>Lux</option>
                        <option value='journal'>Journal</option>
                        <option value='litera'>Litera</option>
                        <option value='minty'>Minty</option>
                        <option value='pulse'>Pulse</option>
                        <option value='sandstone'>Sandstone</option>
                        <option value='sketchy'>Sketchy</option>
                        <option value='solar'>Solar</option>
                        <option value='superhero'>Superhero</option>
                        <option value='united'>United</option>
                        <option value='quartz'>Quartz</option>
                        <option value='vapor'>Vapor</option>
                      </Form.Select>
                    </FloatingLabel>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Container>
        </Tab>
      </Tabs>

      <CreateHouseModal
        show={showCreateHouse}
        handleClose={handleCloseCreateHouse}
        setFetched={setFetched} />
    </Container>
  )
}
