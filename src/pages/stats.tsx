
import { useState, useEffect, useRef } from 'react'
import { useHistory, useParams } from 'react-router-dom'

import Container from 'react-bootstrap/Container'
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'

import { Houses } from '../components/Houses'
import { Creators } from '../components/Creators'
import { Collectors } from '../components/Collectors'
import { Collections } from '../components/Collections'
import { FeaturedQueue } from '../components/FeaturedQueue'


export default function Stats(props: any) {
  const history = useHistory()
  const params = useParams<any>()

  const [ tab, setTab ] = useState(params.tab ? params.tab : 'houses')

  const mounted = useRef(true)

  const handleChangeTab = (key: string | null) => {
    if (!mounted.current)
      return

    setTab(key)

    history.push(`/stats/${key}`)
  }

  useEffect(() => {
    if (!mounted.current)
      return

    const paramsTab = params.tab ? params.tab : 'houses'

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
    <Container fluid='lg'>
      <Tabs activeKey={tab} onSelect={(key) => handleChangeTab(key)} mountOnEnter={true}>
        <Tab eventKey='houses' title='Houses'>
          <Houses limit={10} />
        </Tab>
        <Tab eventKey='creators' title='Creators'>
          <Creators limit={10} />
        </Tab>
        <Tab eventKey='collectors' title='Collectors'>
          <Collectors limit={10} />
        </Tab>
        <Tab eventKey='collections' title='Collections'>
          <Collections limit={10} />
        </Tab>
        <Tab eventKey='featured' title='Featured'>
          <FeaturedQueue limit={10} />
        </Tab>
      </Tabs>
    </Container>
  )
}
