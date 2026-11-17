import type { DataTag, QueryKey, UseSuspenseQueryOptions } from '@tanstack/react-query'

type TaggedQueryKey<TData, TQueryKey extends QueryKey> = {
  queryKey: DataTag<TQueryKey, TData, Error>
}

export type SuspenseQueryOptions<TData, TQueryKey extends QueryKey> = UseSuspenseQueryOptions<TData, Error, TData, TQueryKey> &
  TaggedQueryKey<TData, TQueryKey>
