
import './App.css'

import { useState, useEffect } from 'react'
import { HashRouter as Router, Switch, NavLink, Route } from 'react-router-dom'

import Nav from 'react-bootstrap/Nav'
import Alert from 'react-bootstrap/Alert'
import Navbar from 'react-bootstrap/Navbar'
import Container from 'react-bootstrap/Container'

import { shortAddress } from './utils/nfts'
import { useIPFS, UseIPFSProvider } from './hooks/ipfs'
import { useWallet, UseWalletProvider } from 'use-wallet'
import { useEthereum, UseEthereumProvider } from './hooks/ethereum'

import TokenAmount from 'token-amount'

import Front from './pages/front'
import Collections from './pages/collections'
import Houses from './pages/houses'
import Stats from './pages/stats'
import Mint from './pages/mint'
import About from './pages/about'

import Account from './pages/account'
import Address from './pages/address'
import House from './pages/house'
import HouseQueue from './pages/queue'
import Contract from './pages/contract'
import FullNFT from './pages/nft'
import Deploy from './pages/deploy'
import Payouts from './pages/payouts'


function App() {
  const wallet = useWallet()
  const { provider } = useEthereum()
  const { ipfs, ipfsHost, peerCount } = useIPFS()

  const [ address, setAddress ] = useState('...')
  const [ addressBalance, setAddressBalance ] = useState('0 Ξ')

  const [ dismissed, setDismissed ] = useState(localStorage.getItem('dismissed'))

  const theme = localStorage.getItem('theme') ? localStorage.getItem('theme') : 'darkly'

  const connectWallet = (value: any) => {
    wallet.connect(value)
    localStorage.setItem('WALLET_CONNECTED', value)

    if (theme !== 'darkly') {
      localStorage.removeItem('theme')
      localStorage.setItem('theme', theme || '')
    }
  }

  const resetWallet = () => {
    wallet.reset()
    localStorage.setItem('WALLET_CONNECTED', 'disconnected')
  }

  useEffect(() => {
    const connectedId = localStorage.getItem('WALLET_CONNECTED')

    if (wallet.status === 'disconnected' && connectedId !== null)
      wallet.connect(connectedId)

    const longAddress: string = wallet.account || ''

    if (wallet.status === 'connected') {
      const getAddress = async () => {
        setAddress(await shortAddress(longAddress, provider))
      }

      if (address === '...')
        getAddress()

      if (wallet.balance === '-1')
        setAddressBalance('...')
      else
        setAddressBalance(
          TokenAmount.format(wallet.balance, 18, {
            symbol: 'Ξ',
            digits: 3,
            commify: true
          })
        )
    }
  }, [
    wallet,
    address,
    setAddress,
    provider
  ])

  return (
    <Router>
      <Navbar collapseOnSelect expand='lg' bg='dark' variant='dark' className={`theme-${theme}`}>
        <Container fluid>
          <Navbar.Brand href='#/'>tux.art</Navbar.Brand>
          <Navbar.Collapse id='responsive-navbar-nav'>
            <Nav>
              <Nav.Item>
                <NavLink className='nav-link' to='/collections'>Collections</NavLink>
              </Nav.Item>
              <Nav.Item>
                <NavLink className='nav-link' to='/houses'>Houses</NavLink>
              </Nav.Item>
              <Nav.Item>
                <NavLink className='nav-link' to='/stats'>Stats</NavLink>
              </Nav.Item>
              <Nav.Item>
                <NavLink className='nav-link' to='/mint'>Mint</NavLink>
              </Nav.Item>
              <Nav.Item>
                <NavLink className='nav-link' to='/about'>About</NavLink>
              </Nav.Item>
            </Nav>
          </Navbar.Collapse>
          <Navbar className='justify-content-end'>
            <Nav>
              <Nav.Item className='d-none d-md-block'>
                <Navbar.Text className='px-3'>
                  IPFS: { ipfs !== null ? `${peerCount} peers` : (ipfsHost !== 'https://dweb.link' ? 'ON' : 'OFF') }
                </Navbar.Text>
              </Nav.Item>
              <Nav.Item>
                <Navbar.Text className='px-3'>
                  {addressBalance}
                </Navbar.Text>
              </Nav.Item>
              { wallet.status === 'connected' &&
                <NavLink className='nav-link px-3' to='/account'>
                  {address}
                </NavLink>
              }
              { wallet.status !== 'connected' &&
                <Nav.Link className='px-3' onClick={() => connectWallet('injected')}>
                  Connect
                </Nav.Link>
              }
            </Nav>
          </Navbar>
          <Navbar.Toggle aria-controls='responsive-navbar-nav' className='justify-content-end' />
        </Container>
      </Navbar>
      <div className={`my-4 theme-${theme}`}>
        { !dismissed &&
          <Container fluid className='mb-4'>
            <Alert variant='info' className='text-center' dismissible
                   onClose={() => {
                     setDismissed('ya')
                     localStorage.setItem('dismissed', 'got it')
                   }} >
              Tux is a decentralized and experimental NFT platform. Use at your own risk.
            </Alert>
          </Container>
        }
        <Switch>
          <Route exact path='/'>
            <Front limit={4} activeLimit={8} />
          </Route>
          <Route path='/collections/:offset?'>
            <Collections limit={4} />
          </Route>
          <Route exact path='/houses'>
            <Houses limit={4} />
          </Route>
          <Route path='/stats/:tab?'>
            <Stats />
          </Route>
          <Route path='/mint/:address?'>
            <Mint />
          </Route>
          <Route exact path='/about'>
            <About />
          </Route>
          <Route path='/contract/:address/:offset?'>
            <Contract limit={12} />
          </Route>
          <Route path='/house/:houseId'>
            <House limit={12} />
          </Route>
          <Route path='/queue/:houseId'>
            <HouseQueue limit={12} />
          </Route>
          <Route path='/account/:tab?'>
            <Account resetWallet={resetWallet} limit={4} />
          </Route>
          <Route path='/address/:address/:tab?'>
            <Address limit={4} />
          </Route>
          <Route path='/nft/:contract/:tokenId'>
            <FullNFT />
          </Route>
          <Route exact path='/deploy'>
            <Deploy />
          </Route>
          <Route exact path='/payouts'>
            <Payouts />
          </Route>
        </Switch>
      </div>
    </Router>
  )
}

export default function Index() {
  return (
    <UseWalletProvider
      connectors={{
        injected: {
          chainId: [1, 1337]
        }
      }}>
      <UseIPFSProvider>
        <UseEthereumProvider>
          <App />
        </UseEthereumProvider>
      </UseIPFSProvider>
    </UseWalletProvider>
  )
}
