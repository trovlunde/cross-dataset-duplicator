import {useEffect, useState} from 'react'
import {
  Button,
  Stack,
  Box,
  Label,
  Text,
  Card,
  Flex,
  Grid,
  Container,
  TextInput,
  Select,
} from '@sanity/ui'
import {useSchema, useClient, SanityDocument, SchemaTypeDefinition} from 'sanity'

import Duplicator from './Duplicator'
import {clientConfig} from '../helpers/clientConfig'
import {PluginConfig} from '../types'

type DuplicatorQueryProps = {
  token: string
  pluginConfig: PluginConfig
}

type InitialData = {
  docs: SanityDocument[]
  // draftIds: string[]
}

type QueryParam = 'Groq' | 'Dropdown'

export default function DuplicatorQuery(props: DuplicatorQueryProps) {
  const {token, pluginConfig} = props

  const originClient = useClient(clientConfig)

  const schema = useSchema()
  const schemaTypes = schema.getTypeNames()

  const documentTypes = schema._original?.types
    .map((typing: SchemaTypeDefinition) => {
      if (typing.type === 'document') {
        return typing
      }
      return null
    })
    .filter((element) => element !== null)

  const [queryParam, setQueryParam] = useState<QueryParam>(`Groq`)

  const [value, setValue] = useState(``)
  const [schemaType, setSchemaType] = useState<string>(documentTypes?.[0]?.name ?? '')
  const [initialData, setInitialData] = useState<InitialData>({
    docs: [],
    // draftIds: []
  })

  function handleSubmit(e?: any) {
    if (e) e.preventDefault()

    originClient
      .fetch(value)
      .then((res: SanityDocument[]) => {
        // Ensure queried docs are registered to the schema
        const registeredAndPublishedDocs = res.length
          ? res
              .filter((doc) => schemaTypes.includes(doc._type))
              .filter((doc) => !doc._id.startsWith(`drafts.`))
          : []
        // const initialDraftIds = res.length
        //   ? res.filter((doc) => doc._id.startsWith(`drafts.`)).map((doc) => doc._id)
        //   : []

        setInitialData({
          docs: registeredAndPublishedDocs,
          // draftIds: initialDraftIds
        })
      })
      .catch((err) => console.error(err))
  }

  function handleSelectSubmit(e?: any) {
    if (e) e.preventDefault()

    originClient
      .fetch(`*[_type == "${schemaType}"]`)
      .then((res: SanityDocument[]) => {
        // Ensure queried docs are registered to the schema
        const registeredAndPublishedDocs = res.length
          ? res
              .filter((doc) => schemaTypes.includes(doc._type))
              .filter((doc) => !doc._id.startsWith(`drafts.`))
          : []
        // const initialDraftIds = res.length
        //   ? res.filter((doc) => doc._id.startsWith(`drafts.`)).map((doc) => doc._id)
        //   : []

        setInitialData({
          docs: registeredAndPublishedDocs,
          // draftIds: initialDraftIds
        })
      })
      .catch((err) => console.error(err))
  }

  function handleSelect(event: React.FormEvent<HTMLSelectElement>) {
    setSchemaType(
      documentTypes?.find((element) => element?.title === event.currentTarget.value)?.name ?? ''
    )
  }

  // Auto-load initial textinput value
  useEffect(() => {
    if (!initialData.docs?.length && value) {
      handleSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Container width={[1, 1, 1, 3]} padding={[0, 0, 0, 5]}>
      <Grid columns={[1, 1, 1, 2]} gap={[1, 1, 1, 4]}>
        <Box padding={[2, 2, 2, 0]}>
          <Card padding={4} radius={3} border>
            <Stack space={4}>
              <Box>
                <Label>Initial Documents Query</Label>
              </Box>
              <Box>
                <Select
                  fontSize={[2, 2, 3, 4]}
                  padding={[1, 1, 3]}
                  width={1}
                  space={[1, 1, 2]}
                  onChange={(event) => setQueryParam(event.currentTarget.value as QueryParam)}
                >
                  <option>Groq</option>
                  <option>Dropdown</option>
                </Select>
              </Box>
              {queryParam === 'Groq' && (
                <>
                  <Box>
                    <Text>
                      Start with a valid GROQ query to load initial documents. The query will need
                      to return an Array of Objects. Drafts will be removed from the results.
                    </Text>
                  </Box>
                  <form onSubmit={handleSubmit}>
                    <Flex>
                      <Box flex={1} paddingRight={2}>
                        <TextInput
                          style={{fontFamily: 'monospace'}}
                          fontSize={2}
                          // eslint-disable-next-line react/jsx-no-bind
                          onChange={(event) => setValue(event.currentTarget.value)}
                          padding={4}
                          placeholder={`*[_type == "article"]`}
                          value={value ?? ``}
                        />
                      </Box>
                      <Button
                        padding={2}
                        paddingX={4}
                        tone="primary"
                        onClick={handleSubmit}
                        text="Groq Query"
                        disabled={!value}
                      />
                    </Flex>
                  </form>
                </>
              )}
              {queryParam === 'Dropdown' && (
                <>
                  <Box>
                    <Text>
                      Choose from the list of document types in your schema. Drafts will be removed
                      from the results.
                    </Text>
                  </Box>
                  <form onSubmit={handleSelectSubmit}>
                    <Flex>
                      <Select
                        fontSize={[2, 2, 3, 4]}
                        padding={[3, 3, 4]}
                        space={[3, 3, 4]}
                        onChange={(event) => handleSelect(event)}
                      >
                        {documentTypes?.map((document) => (
                          <option key={document?.title}>{document?.title}</option>
                        ))}
                      </Select>
                      <Button
                        padding={2}
                        paddingX={4}
                        tone="primary"
                        onClick={handleSelectSubmit}
                        text="Dropdown Query"
                        disabled={!schemaType}
                      />
                    </Flex>
                  </form>
                </>
              )}
            </Stack>
          </Card>
        </Box>
        {!initialData.docs?.length ||
          (initialData.docs.length < 1 && (
            <Container width={1}>
              <Card padding={5}>
                {value
                  ? `No Documents registered to the Schema match this query`
                  : `Start with a valid GROQ query`}
              </Card>
            </Container>
          ))}
        {initialData.docs?.length > 0 && (
          <Duplicator
            docs={initialData.docs}
            // draftIds={initialData.draftIds}
            token={token}
            pluginConfig={pluginConfig}
          />
        )}
      </Grid>
    </Container>
  )
}
