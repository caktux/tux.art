
import Container from 'react-bootstrap/Container'

import { Featured } from '../components/Featured'
import { ActiveHouses } from '../components/ActiveHouses'
import { RankedHouses } from '../components/RankedHouses'
import { ActiveAuctions } from '../components/ActiveAuctions'
import { RankedAuctions } from '../components/RankedAuctions'


export default function Front(props: any) {
  return (
    <Container fluid>
      <Featured />

      <ActiveAuctions limit={8} />

      <ActiveHouses limit={4} />

      <RankedHouses limit={4} />

      <RankedAuctions limit={8} />
    </Container>
  )
}
