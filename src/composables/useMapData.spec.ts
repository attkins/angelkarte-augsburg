import { describe, expect, it } from 'vitest'
import { makeClub, makeMapData, makeSalesPoint, makeWater } from '../../tests/fixtures'

describe('buildMapData', () => {
  it('indexes clubs, waters and sales points by id', () => {
    const data = makeMapData(
      [makeClub({ id: 'c1' }), makeClub({ id: 'c2' })],
      [makeWater({ id: 'w1', clubId: 'c1' }), makeWater({ id: 'w2', clubId: 'c2' })],
      [makeSalesPoint({ id: 's1', waterIds: ['w1'] })],
    )

    expect([...data.clubsById.keys()]).toEqual(['c1', 'c2'])
    expect(data.watersById.get('w2')?.properties.clubId).toBe('c2')
    expect(data.salesPointsById.get('s1')?.properties.name).toBe('Angelladen A')
  })

  it('derives which sales points sell a water from the sales point side', () => {
    const data = makeMapData(
      [makeClub()],
      [makeWater({ id: 'w1' }), makeWater({ id: 'w2' })],
      [
        makeSalesPoint({ id: 's1', waterIds: ['w1', 'w2'] }),
        makeSalesPoint({ id: 's2', waterIds: ['w2'] }),
      ],
    )

    expect(data.salesPointIdsByWater.get('w1')).toEqual(['s1'])
    expect(data.salesPointIdsByWater.get('w2')).toEqual(['s1', 's2'])
  })

  it('has no entry for waters without sales points', () => {
    const data = makeMapData([makeClub()], [makeWater({ id: 'w1' })], [])

    expect(data.salesPointIdsByWater.has('w1')).toBe(false)
  })

  it('tolerates a sales point without waterIds', () => {
    const salesPoint = makeSalesPoint({ id: 's1' })
    // Older data files may lack the property entirely.
    delete (salesPoint.properties as Partial<typeof salesPoint.properties>).waterIds

    const data = makeMapData([makeClub()], [makeWater()], [salesPoint])

    expect(data.salesPointIdsByWater.size).toBe(0)
  })

  it('keeps the original collections', () => {
    const data = makeMapData()

    expect(data.waters.features).toHaveLength(1)
    expect(data.salesPoints.features).toHaveLength(1)
    expect(data.clubs).toHaveLength(1)
  })
})
