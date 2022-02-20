
import { useEffect, useState, useRef } from 'react'
import { useIPFS } from '../hooks/ipfs'

import Container from 'react-bootstrap/Container'
import Spinner from 'react-bootstrap/Spinner'

import { urlSource } from 'ipfs-http-client'
// import { fetchWithTimeout } from '../utils/ipfs'


export function LazyImg (props: any) {
  const { ipfs, ipfsHost } = useIPFS()

  const [ loaded, setLoaded ] = useState(false)
  const [ started, setStarted ] = useState(false)
  const [ timedOut, setTimedOut ] = useState(false)
  const [ errored, setErrored ] = useState(0)
  const [ src, setSrc ] = useState(props.src)
  const [ img, setImg ] = useState({ complete: false } as any)

  const mounted = useRef(true)

  const hosts = [
    ipfsHost,
    `https://cf-ipfs.com`,
    `https://ipfs.io`,
    `https://infura-ipfs.io`,
    `https://gateway.pinata.cloud`,
    `https://ipfsgateway.makersplace.com`,
  ]

  const handleLoad = () => {
    if (loaded || !mounted.current)
      return

    setLoaded(true)

    if (typeof props.onImageLoad === 'function')
      props.onImageLoad()

    if (ipfs && props.isOwner) {
      const pinToIPFS = async () => {
        try {
          // const res = await fetchWithTimeout(src, {
          //   timeout: 15000
          // })
          //
          // if (res.status >= 400) {
          //   console.warn(res.status)
          //   return
          // }
          //
          // const blob = await res.blob()
          const added = await ipfs.add(urlSource(src, {timeout: 15000})) // blob)
          console.log(`Pinned ${src}`, added)
        } catch(e: any) {
          console.warn(e.message)
        }
      }
      pinToIPFS()
    }
  }

  const handleTimeout = () => {
    if (loaded || img.complete || !mounted.current)
      return

    let newSrc = src
    for (let i = 0; i < hosts.length; i++) {
      if (src.startsWith(hosts[i])) {
        newSrc = src.replace(hosts[i], hosts[i === hosts.length - 1 ? 0 : i + 1])
        console.log(`Timed out on ${src}, trying ${newSrc}`)
        break
      }
    }
    setTimedOut(false)
    setStarted(false)

    setSrc(newSrc)
  }

  const startTimer = () => {
    if (!mounted.current)
      return
    setStarted(true)

    setTimeout(() => {
      if (!mounted.current)
        return
      setTimedOut(true)
    }, 10000);
  }

  useEffect(() => {
    if (!started && mounted.current)
      startTimer()
  })

  useEffect(() => {
    if (!loaded && img.complete && mounted.current)
      handleLoad()
  })

  useEffect(() => {
    if (timedOut && !loaded && mounted.current)
      handleTimeout()
  })

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <>
      { !loaded ?
        <Container className='text-center'>
          <Spinner animation='grow' role='status' />
        </Container> : <></>
      }
      <img
        src={src}
        alt={props.alt}
        onLoad={handleLoad}
        onError={() => {
          if (mounted.current) {
            let newSrc = src
            for (let i = 0; i < hosts.length; i++) {
              if (src.startsWith(hosts[i])) {
                newSrc = src.replace(hosts[i], hosts[i === hosts.length - 1 ? 0 : i + 1])
                console.log(`Errored out on ${src}, trying ${newSrc}`)
                break
              }
            }
            setTimeout(() => {
              if (errored > 3) {
                console.warn(`Gave up on ${src}`)
                return
              }
              if (!mounted.current)
                return
              setErrored(errored + 1)
              setTimedOut(false)
              setStarted(false)
              setSrc(newSrc)
            }, 3000);
          }
        }}
        onClick={() => {
          if (props.fullscreen)
            props.fullscreen.active ?
              props.fullscreen.exit() :
              props.fullscreen.enter()
        }}
        className={
          `lazy-image${loaded ? '-loaded' : ''}
          ${props.className}`
        }
        ref={(img) => {
          if (img && mounted.current)
            setImg(img)
        }}
        style={{ visibility: loaded ? 'visible' : 'hidden' }}
      />
    </>
  )
}
