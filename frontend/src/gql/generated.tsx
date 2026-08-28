/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type AssignRoleInput = {
  roleName: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};

export type AssignRolePayload = OperationInfo | RoleError | UserType;

export type AuthError = {
  __typename?: 'AuthError';
  message: Scalars['String']['output'];
};

export type CreateUserPayload = OperationInfo | UserType;

export type DeleteUserPayload = OperationInfo | UserType;

/** role | name */
export enum IamRoleNameEnum {
  /** Admin */
  Admin = 'admin',
  /** Auditor */
  Auditor = 'auditor',
  /** CISO */
  Ciso = 'ciso',
  /** Control Owner */
  ControlOwner = 'control_owner',
  /** Risk Manager */
  RiskManager = 'risk_manager',
  /** Viewer */
  Viewer = 'viewer'
}

export type IamRoleNameEnumFilterLookup = {
  /** Case-sensitive containment test. Filter will be skipped on `null` value */
  contains?: InputMaybe<IamRoleNameEnum>;
  /** Case-sensitive ends-with. Filter will be skipped on `null` value */
  endsWith?: InputMaybe<IamRoleNameEnum>;
  /** Exact match. Filter will be skipped on `null` value */
  exact?: InputMaybe<IamRoleNameEnum>;
  /** Case-insensitive containment test. Filter will be skipped on `null` value */
  iContains?: InputMaybe<IamRoleNameEnum>;
  /** Case-insensitive ends-with. Filter will be skipped on `null` value */
  iEndsWith?: InputMaybe<IamRoleNameEnum>;
  /** Case-insensitive exact match. Filter will be skipped on `null` value */
  iExact?: InputMaybe<IamRoleNameEnum>;
  /** Case-insensitive regular expression match. Filter will be skipped on `null` value */
  iRegex?: InputMaybe<IamRoleNameEnum>;
  /** Case-insensitive starts-with. Filter will be skipped on `null` value */
  iStartsWith?: InputMaybe<IamRoleNameEnum>;
  /** Exact match of items in a given list. Filter will be skipped on `null` value */
  inList?: InputMaybe<Array<IamRoleNameEnum>>;
  /** Assignment test. Filter will be skipped on `null` value */
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  /** Case-sensitive regular expression match. Filter will be skipped on `null` value */
  regex?: InputMaybe<IamRoleNameEnum>;
  /** Case-sensitive starts-with. Filter will be skipped on `null` value */
  startsWith?: InputMaybe<IamRoleNameEnum>;
};

export type LoginResult = AuthError | UserType;

export type Mutation = {
  __typename?: 'Mutation';
  assignRole: AssignRolePayload;
  createUser: CreateUserPayload;
  deleteUser: DeleteUserPayload;
  login: LoginResult;
  logout: Scalars['Boolean']['output'];
  requestPasswordReset: Scalars['Boolean']['output'];
  resetPassword: ResetPasswordPayload;
  revokeRole: RevokeRolePayload;
  updateUser: UpdateUserPayload;
};


export type MutationAssignRoleArgs = {
  data: AssignRoleInput;
};


export type MutationCreateUserArgs = {
  data: UserCreateInput;
};


export type MutationDeleteUserArgs = {
  data: NodeInput;
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationRequestPasswordResetArgs = {
  email: Scalars['String']['input'];
};


export type MutationResetPasswordArgs = {
  newPassword: Scalars['String']['input'];
  token: Scalars['String']['input'];
  uid: Scalars['String']['input'];
};


export type MutationRevokeRoleArgs = {
  data: AssignRoleInput;
};


export type MutationUpdateUserArgs = {
  data: UserUpdateInput;
};

/** Input of an object that implements the `Node` interface. */
export type NodeInput = {
  id: Scalars['ID']['input'];
};

export type OffsetPaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: Scalars['Int']['input'];
};

export type OperationInfo = {
  __typename?: 'OperationInfo';
  /** List of messages returned by the operation. */
  messages: Array<OperationMessage>;
};

export type OperationMessage = {
  __typename?: 'OperationMessage';
  /** The error code, or `null` if no error code was set. */
  code?: Maybe<Scalars['String']['output']>;
  /** The field that caused the error, or `null` if it isn't associated with any particular field. */
  field?: Maybe<Scalars['String']['output']>;
  /** The kind of this message. */
  kind: OperationMessageKind;
  /** The error message. */
  message: Scalars['String']['output'];
};

export enum OperationMessageKind {
  Error = 'ERROR',
  Info = 'INFO',
  Permission = 'PERMISSION',
  Validation = 'VALIDATION',
  Warning = 'WARNING'
}

export enum Ordering {
  Asc = 'ASC',
  AscNullsFirst = 'ASC_NULLS_FIRST',
  AscNullsLast = 'ASC_NULLS_LAST',
  Desc = 'DESC',
  DescNullsFirst = 'DESC_NULLS_FIRST',
  DescNullsLast = 'DESC_NULLS_LAST'
}

export type Query = {
  __typename?: 'Query';
  me?: Maybe<UserType>;
  roles: Array<RoleType>;
  users: Array<UserType>;
};


export type QueryRolesArgs = {
  filters?: InputMaybe<RoleFilter>;
  order?: InputMaybe<RoleOrder>;
};


export type QueryUsersArgs = {
  filters?: InputMaybe<UserFilter>;
  order?: InputMaybe<UserOrder>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};

export type ResetPasswordPayload = OperationInfo | UserType;

export type RevokeRolePayload = OperationInfo | RoleError | UserType;

export type RoleError = {
  __typename?: 'RoleError';
  message: Scalars['String']['output'];
};

/** Role(id, name) */
export type RoleFilter = {
  AND?: InputMaybe<RoleFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<RoleFilter>;
  OR?: InputMaybe<RoleFilter>;
  name?: InputMaybe<IamRoleNameEnumFilterLookup>;
};

export type RoleOrder =
  { name: Ordering; };

/** Role(id, name) */
export type RoleType = {
  __typename?: 'RoleType';
  id: Scalars['ID']['output'];
  name: IamRoleNameEnum;
};

export type StrFilterLookup = {
  /** Case-sensitive containment test. Filter will be skipped on `null` value */
  contains?: InputMaybe<Scalars['String']['input']>;
  /** Case-sensitive ends-with. Filter will be skipped on `null` value */
  endsWith?: InputMaybe<Scalars['String']['input']>;
  /** Exact match. Filter will be skipped on `null` value */
  exact?: InputMaybe<Scalars['String']['input']>;
  /** Case-insensitive containment test. Filter will be skipped on `null` value */
  iContains?: InputMaybe<Scalars['String']['input']>;
  /** Case-insensitive ends-with. Filter will be skipped on `null` value */
  iEndsWith?: InputMaybe<Scalars['String']['input']>;
  /** Case-insensitive exact match. Filter will be skipped on `null` value */
  iExact?: InputMaybe<Scalars['String']['input']>;
  /** Case-insensitive regular expression match. Filter will be skipped on `null` value */
  iRegex?: InputMaybe<Scalars['String']['input']>;
  /** Case-insensitive starts-with. Filter will be skipped on `null` value */
  iStartsWith?: InputMaybe<Scalars['String']['input']>;
  /** Exact match of items in a given list. Filter will be skipped on `null` value */
  inList?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Assignment test. Filter will be skipped on `null` value */
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  /** Case-sensitive regular expression match. Filter will be skipped on `null` value */
  regex?: InputMaybe<Scalars['String']['input']>;
  /** Case-sensitive starts-with. Filter will be skipped on `null` value */
  startsWith?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserPayload = OperationInfo | UserType;

export type UserCreateInput = {
  email: Scalars['String']['input'];
  firstName?: Scalars['String']['input'];
  lastName?: Scalars['String']['input'];
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

/** Application user. Email is the login identifier. */
export type UserFilter = {
  AND?: InputMaybe<UserFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<UserFilter>;
  OR?: InputMaybe<UserFilter>;
  email?: InputMaybe<StrFilterLookup>;
  lastName?: InputMaybe<StrFilterLookup>;
};

export type UserOrder =
  { email: Ordering; lastName?: never; }
  |  { email?: never; lastName: Ordering; };

/** Application user. Email is the login identifier. */
export type UserType = {
  __typename?: 'UserType';
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastName: Scalars['String']['output'];
  roles: Array<RoleType>;
  /** Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. */
  username: Scalars['String']['output'];
};

/** Application user. Email is the login identifier. */
export type UserUpdateInput = {
  firstName?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
};

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me: { id: string, email: string, firstName: string, lastName: string } | null };

export type LoginMutationVariables = Exact<{
  email: string;
  password: string;
}>;


export type LoginMutation = { login:
    | { __typename: 'AuthError', message: string }
    | { __typename: 'UserType', id: string, email: string, firstName: string, lastName: string }
   };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { logout: boolean };

export type RequestPasswordResetMutationVariables = Exact<{
  email: string;
}>;


export type RequestPasswordResetMutation = { requestPasswordReset: boolean };

export type ResetPasswordMutationVariables = Exact<{
  uid: string;
  token: string;
  newPassword: string;
}>;


export type ResetPasswordMutation = { resetPassword:
    | { __typename: 'OperationInfo', messages: Array<{ message: string }> }
    | { __typename: 'UserType', id: string }
   };


export const MeDocument = gql`
    query Me {
  me {
    id
    email
    firstName
    lastName
  }
}
    `;

/**
 * __useMeQuery__
 *
 * To run a query within a React component, call `useMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useMeQuery(baseOptions?: Apollo.QueryHookOptions<MeQuery, MeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MeQuery, MeQueryVariables>(MeDocument, options);
      }
export function useMeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MeQuery, MeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MeQuery, MeQueryVariables>(MeDocument, options);
        }
// @ts-ignore
export function useMeSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>): Apollo.UseSuspenseQueryResult<MeQuery, MeQueryVariables>;
export function useMeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>): Apollo.UseSuspenseQueryResult<MeQuery | undefined, MeQueryVariables>;
export function useMeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MeQuery, MeQueryVariables>(MeDocument, options);
        }
export type MeQueryHookResult = ReturnType<typeof useMeQuery>;
export type MeLazyQueryHookResult = ReturnType<typeof useMeLazyQuery>;
export type MeSuspenseQueryHookResult = ReturnType<typeof useMeSuspenseQuery>;
export type MeQueryResult = Apollo.QueryResult<MeQuery, MeQueryVariables>;
export const LoginDocument = gql`
    mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    __typename
    ... on UserType {
      id
      email
      firstName
      lastName
    }
    ... on AuthError {
      message
    }
  }
}
    `;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      email: // value for 'email'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: Apollo.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const LogoutDocument = gql`
    mutation Logout {
  logout
}
    `;
export type LogoutMutationFn = Apollo.MutationFunction<LogoutMutation, LogoutMutationVariables>;

/**
 * __useLogoutMutation__
 *
 * To run a mutation, you first call `useLogoutMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLogoutMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [logoutMutation, { data, loading, error }] = useLogoutMutation({
 *   variables: {
 *   },
 * });
 */
export function useLogoutMutation(baseOptions?: Apollo.MutationHookOptions<LogoutMutation, LogoutMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LogoutMutation, LogoutMutationVariables>(LogoutDocument, options);
      }
export type LogoutMutationHookResult = ReturnType<typeof useLogoutMutation>;
export type LogoutMutationResult = Apollo.MutationResult<LogoutMutation>;
export type LogoutMutationOptions = Apollo.BaseMutationOptions<LogoutMutation, LogoutMutationVariables>;
export const RequestPasswordResetDocument = gql`
    mutation RequestPasswordReset($email: String!) {
  requestPasswordReset(email: $email)
}
    `;
export type RequestPasswordResetMutationFn = Apollo.MutationFunction<RequestPasswordResetMutation, RequestPasswordResetMutationVariables>;

/**
 * __useRequestPasswordResetMutation__
 *
 * To run a mutation, you first call `useRequestPasswordResetMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRequestPasswordResetMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [requestPasswordResetMutation, { data, loading, error }] = useRequestPasswordResetMutation({
 *   variables: {
 *      email: // value for 'email'
 *   },
 * });
 */
export function useRequestPasswordResetMutation(baseOptions?: Apollo.MutationHookOptions<RequestPasswordResetMutation, RequestPasswordResetMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RequestPasswordResetMutation, RequestPasswordResetMutationVariables>(RequestPasswordResetDocument, options);
      }
export type RequestPasswordResetMutationHookResult = ReturnType<typeof useRequestPasswordResetMutation>;
export type RequestPasswordResetMutationResult = Apollo.MutationResult<RequestPasswordResetMutation>;
export type RequestPasswordResetMutationOptions = Apollo.BaseMutationOptions<RequestPasswordResetMutation, RequestPasswordResetMutationVariables>;
export const ResetPasswordDocument = gql`
    mutation ResetPassword($uid: String!, $token: String!, $newPassword: String!) {
  resetPassword(uid: $uid, token: $token, newPassword: $newPassword) {
    __typename
    ... on UserType {
      id
    }
    ... on OperationInfo {
      messages {
        message
      }
    }
  }
}
    `;
export type ResetPasswordMutationFn = Apollo.MutationFunction<ResetPasswordMutation, ResetPasswordMutationVariables>;

/**
 * __useResetPasswordMutation__
 *
 * To run a mutation, you first call `useResetPasswordMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useResetPasswordMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [resetPasswordMutation, { data, loading, error }] = useResetPasswordMutation({
 *   variables: {
 *      uid: // value for 'uid'
 *      token: // value for 'token'
 *      newPassword: // value for 'newPassword'
 *   },
 * });
 */
export function useResetPasswordMutation(baseOptions?: Apollo.MutationHookOptions<ResetPasswordMutation, ResetPasswordMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ResetPasswordMutation, ResetPasswordMutationVariables>(ResetPasswordDocument, options);
      }
export type ResetPasswordMutationHookResult = ReturnType<typeof useResetPasswordMutation>;
export type ResetPasswordMutationResult = Apollo.MutationResult<ResetPasswordMutation>;
export type ResetPasswordMutationOptions = Apollo.BaseMutationOptions<ResetPasswordMutation, ResetPasswordMutationVariables>;