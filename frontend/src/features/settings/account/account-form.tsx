import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { usersApi, type AccessToken, type AccessTokenList } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function AccountForm() {
  const queryClient = useQueryClient()
  const [tokenName, setTokenName] = useState('')
  const [createdToken, setCreatedToken] = useState<AccessToken | null>(null)

  const { data: tokens, isPending } = useQuery({
    queryKey: ['users', 'api-token'],
    queryFn: () => usersApi.listTokens(),
  })

  const create = useMutation({
    mutationFn: () => usersApi.createToken(tokenName.trim() || undefined),
    onSuccess: (token) => {
      setCreatedToken(token)
      setTokenName('')
      queryClient.invalidateQueries({ queryKey: ['users', 'api-token'] })
    },
    onError: handleServerError,
  })

  const revoke = useMutation({
    mutationFn: (id: number) => usersApi.deleteToken(id),
    onSuccess: (_data, id) => {
      toast.success('Token revoked.')
      queryClient.setQueryData<AccessTokenList[]>(['users', 'api-token'], (old) =>
        old ? old.filter((t) => t.id !== id) : old
      )
    },
    onError: handleServerError,
  })

  async function copyToken() {
    if (!createdToken) return
    try {
      await navigator.clipboard.writeText(createdToken.token)
      toast.success('Token copied to clipboard.')
    } catch {
      toast.error('Could not copy token.')
    }
  }

  return (
    <div className='space-y-8'>
      <section className='space-y-4'>
        <div>
          <h3 className='text-lg font-medium'>Create API token</h3>
          <p className='text-sm text-muted-foreground'>
            Generate a token to authenticate third-party clients. The raw token
            is shown only once at creation.
          </p>
        </div>

        {createdToken && (
          <Alert>
            <AlertTitle>Copy your token now</AlertTitle>
            <AlertDescription className='space-y-3'>
              <p>
                This is the only time the raw token is shown. Store it
                securely — you cannot retrieve it again.
              </p>
              <code className='block break-all rounded border bg-muted px-3 py-2 text-sm'>
                {createdToken.token}
              </code>
              <Button type='button' variant='outline' size='sm' onClick={copyToken}>
                <Copy className='me-2 size-4' />
                Copy token
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className='flex max-w-md items-end gap-2'>
          <div className='grid flex-1 gap-1.5'>
            <Label htmlFor='token-name'>Name</Label>
            <Input
              id='token-name'
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder='e.g. CI pipeline'
              disabled={create.isPending}
            />
          </div>
          <Button
            type='button'
            onClick={() => create.mutate()}
            disabled={create.isPending}
          >
            {create.isPending ? (
              <Loader2 className='me-2 size-4 animate-spin' />
            ) : (
              <Plus className='me-2 size-4' />
            )}
            Create
          </Button>
        </div>
      </section>

      <section className='space-y-4'>
        <div>
          <h3 className='text-lg font-medium'>Active tokens</h3>
          <p className='text-sm text-muted-foreground'>
            Revoke any token you no longer use. Revoking is immediate.
          </p>
        </div>

        {isPending ? (
          <div className='flex items-center gap-2 text-muted-foreground'>
            <Loader2 className='size-4 animate-spin' />
            Loading tokens...
          </div>
        ) : tokens && tokens.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead className='w-20 text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell className='font-medium'>{token.name || '—'}</TableCell>
                  <TableCell className='text-muted-foreground'>
                    {token.lastUsage
                      ? new Date(token.lastUsage).toLocaleString()
                      : 'Never'}
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => revoke.mutate(token.id)}
                      disabled={revoke.isPending}
                      title='Revoke token'
                    >
                      <Trash2 className='size-4 text-destructive' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className='text-sm text-muted-foreground'>No tokens yet.</p>
        )}
      </section>
    </div>
  )
}
