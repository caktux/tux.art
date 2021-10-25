
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import braveIPFS from '../images/BraveIPFS.png'
import accessControlAllowOrigin from '../images/AccessControlAllowOrigin.png'


export default function About() {
  return (
    <Container>
      <Row>
        <Col xs={12}>
          <h3 className='my-5'>
            About
          </h3>
        </Col>
        <Col xs={12} className='text-muted about-page'>
          <p>
            Welcome to Tux, a decentralized and open source NFT platform.
          </p>

          <p>
            Smart contracts can be found at <a href='https://github.com/caktux/tux-contracts' target='blank'>
            https://github.com/caktux/tux-contracts</a> and the user interface
            at <a href='https://github.com/caktux/tux.art' target='blank'>https://github.com/caktux/tux.art</a>
          </p>

          <h5>Recommended setup</h5>
          <p>
            Running a local IPFS node is optional but highly recommended. The easiest way is by using
            the <a href='https://brave.com/' target='blank'>Brave browser</a> and setting the
            "Method to resolve IPFS resources" to "Local node" in the settings (or
            type <code>chrome://settings/ipfs</code> in the address bar).
            You should then access Tux directly on IPFS from <a href='ipns://tux.art' target='blank'>
            ipns://tux.art</a> once you're set up.
          </p>
          <p className='text-center'>
            <img src={braveIPFS} alt='Brave IPFS' style={{ width: 652, maxWidth: '100%' }} />
          </p>
          <p>
            By running a local node, you'll have faster access to previously downloaded images
            and files. You'll also help the network get more decentralized, which should improve
            the speed for other users. Raising the cache size to 10GB or more is also recommended
            if you have enough disk space available.
          </p>
          <p>
            If you plan on minting on Tux, you might also want to enable access to your local
            node's API. It's a more advanced configuration, and very optional, but it allows
            to pin your NFTs locally, also improving the network and providing a backup
            to the remote pinning services used by Tux, <a href='https://nft.storage'
            target='blank'>nft.storage</a> and <a href='https://infura.io'
            target='blank'>Infura</a>.
          </p>
          <p>
            To enable API access, replace the empty <code>API {'>'} HTTPHeaders {'> '}
            Access-Control-Allow-Origin</code> section of your IPFS configuration (accessible
            by clicking on (details) from <code>brave://ipfs</code> if using Brave's built-in
            IPFS node, and going to the Settings tab), with the following: <code>
              {`"Access-Control-Allow-Origin": ["*"]`}
            </code>
          </p>
          <p className='text-center'>
            <img src={accessControlAllowOrigin} alt='AccessControlAllowOrigin'
                 style={{ width: 365, maxWidth: '100%' }} />
          </p>
          <p>
            Running a standalone IPFS node is also a great option, and Tux should detect it
            if it's using the default port numbers. The same API access setup is still required
            to allow Tux to pin files on your node.
          </p>

          <h5>Houses</h5>
          <p>
            Curation on Tux is achieved using "Houses". Anyone can create a house and add creators
            to it. Creators can then choose under which house to list their piece. Choosing a
            house is optional. House curators can set a curation fee, which can be updated (existing
            auctions keep their current fee), and need to decide whether they pre-approve auctions
            from the creators they add or have to approve each and every auction.
          </p>

          <h5>Collections</h5>
          <p>
            Collections are token contracts, from Tux or other platforms. Anyone can create a collection
            and mint pieces on it. It's the same basic token contract as Tux, but only allows you to
            mint new pieces. Creating a collection requires two transactions. You will be deploying
            your own minting contract with the first one, then registering it on Tux with the second.
            You can then mint new pieces in your collection with the "Mint in this collection" button.
            Token contracts from other platforms need to adhere to the ERC721 standard as well as its
            Metadata and Enumerable extensions to be compatible with Tux.
          </p>

          <h5>Minting</h5>
          <p>
            Anyone can mint on Tux. Creators need to upload a preview image and the full resolution
            image or other media file. Since Tux is fully decentralized, we need to have thumbnails
            recorded in the metadata and stored on IPFS to provide faster loading times. You'll
            notice how the collection browser of other platforms might be slow to load, since few
            of them store thumbnail images that way, using their own server infrastructure instead.
            This means we need to load every full resolution image from IPFS when looking at
            NFTs from these contracts.
          </p>

          <h5>Rankings</h5>
          <p>
            Rankings are based on the number of bids and need to be updated separately since it
            gets too expensive to calculate on every bid. Curators should be updating
            their houses' rankings from time to time, and creators might also want to update
            theirs. Token contracts (collections) are also ranked and might gain visibility from
            getting updated. Collectors have less to gain from showing up where they should in
            the rankings but might also want to update theirs every so often.
          </p>

          <h5>Accounts</h5>
          <p>
            You can set a display name, bio and profile picture for your account. Updating any of those
            requires a separate Ethereum transaction. You can also choose a different theme, and that
            setting is only stored in your browser.
          </p>

          <h5>Featured auctions and the TUX token</h5>
          <p>
            You earn TUX tokens when interacting with the platform. Creating an auction, placing a bid
            or finalizing an auction earns you 10 TUX, and another 1 TUX if your transaction triggered
            the update of the featured piece. Creating a house earns you 5 TUX. Adding a creator,
            updating a rank, registering a collection, and making or accepting a standalone offer
            earns you 1 TUX.
          </p>
          <p>
            The goal of the TUX token is to offset gas costs, to provide a mechanism for the front
            page's featured auction, and to make weekly payouts to the various Ethereum JSON-RPC
            endpoints and IPFS pinning services*.
          </p>
          <p>
            You can then hold or sell your TUX tokens, or use them to add an auction to the
            featured queue, which gets ordered by the amount of TUX paid to get featured. TUX
            tokens offered to get featured are then burned. The minimum price for featured auctions
            is 1 TUX. You can also cancel featuring an auction, in which case new TUX tokens get issued
            back to you.
          </p>
          <p>
            Initial issuance is 100,000 TUX to caktux.eth, of which half is put on Uniswap along with
            some ETH to provide initial liquidity.
          </p>
          <p>
            * Agreements still need to be made with Alchemy, Infura, Pokt, Protocol Labs and Cloudflare.
            Etherscan will receive payouts to their donation address. Pinata replied that they only
            accept credit and debit card payments...
          </p>

          <h5>Metadata format</h5>
          <p>
            Tux follows the ERC721 standard closely, adding only <code>media</code>, <code>
            imageMimeType</code> and <code>mediaMimeType</code> as new fields to the metadata extension.
            The <code>image</code> field is used for the thumbnail image, as the ERC721 metadata
            extension intended.
          </p>

          <h5>House metadata format</h5>
          <p>
            Houses will eventually be able to set their own metadata to allow choosing featured pieces
            and creators, add a logo and external links, and surely other customizations to promote
            its creators.
          </p>
        </Col>
      </Row>
    </Container>
  )
}
