'use client';

import { useRef, useState } from 'react';
import {
  AlertDialog,
  Button,
  Callout,
  Dialog,
  Flex,
  Text
} from '@radix-ui/themes';
import Avatar from '@/components/common/Avatar';
import {
  useRemoveMyAvatarMutation,
  useUpdateMyAvatarMutation
} from '@/features/profile/__generated__/queries.generated';
import {
  ACCEPTED_IMAGE_TYPES,
  ImageReadError,
  toSquareDataUrl
} from '@/lib/image';
import type { ProfileUser } from './types';

const GENERIC_ERROR = 'That photo could not be saved. Please try again.';

/**
 * Upload, replace or remove the account holder's profile photo. The image is
 * cropped square and downscaled in the browser before upload; the server
 * re-encodes it and strips any embedded metadata.
 */
export function AvatarUploadDialog({
  user,
  onChanged
}: {
  user: ProfileUser;
  onChanged: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [updateMyAvatar, { loading: saving }] = useUpdateMyAvatarMutation();
  const [removeMyAvatar, { loading: removing }] = useRemoveMyAvatarMutation();

  const fullName = `${user.firstName} ${user.lastName}`.trim() || user.email;

  function reset() {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleFileChange(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      setPreview(await toSquareDataUrl(file));
    } catch (cause) {
      setPreview(null);
      setError(cause instanceof ImageReadError ? cause.message : GENERIC_ERROR);
    }
  }

  async function handleSave() {
    if (!preview) return;
    setError(null);
    try {
      const { data } = await updateMyAvatar({
        variables: { imageBase64: preview },
        refetchQueries: ['MyProfile', 'Me', 'MyAuditEvents']
      });
      const result = data?.updateMyAvatar;
      if (result?.__typename === 'OperationInfo') {
        setError(result.messages.map(m => m.message).join(' '));
        return;
      }
      setOpen(false);
      reset();
      onChanged();
    } catch {
      setError(GENERIC_ERROR);
    }
  }

  async function handleRemove() {
    setError(null);
    try {
      const { data } = await removeMyAvatar({
        refetchQueries: ['MyProfile', 'Me', 'MyAuditEvents']
      });
      const result = data?.removeMyAvatar;
      if (result?.__typename === 'OperationInfo') {
        setError(result.messages.map(m => m.message).join(' '));
        return;
      }
      setOpen(false);
      reset();
      onChanged();
    } catch {
      setError(GENERIC_ERROR);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={next => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <Dialog.Trigger>
        <Button variant="soft" color="gray" size="1">
          <span className="far fa-image" aria-hidden="true" />
          {user.avatarUrl ? 'Change photo' : 'Add photo'}
        </Button>
      </Dialog.Trigger>

      <Dialog.Content maxWidth="420px">
        <Dialog.Title>Profile photo</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Square images work best. Anything else is cropped from the centre.
        </Dialog.Description>

        <Flex direction="column" align="center" gap="3">
          <Avatar
            name={fullName}
            src={preview ?? user.avatarUrl}
            size="4xl"
            round="circle"
          />

          <input
            ref={fileInputRef}
            type="file"
            className="form-control form-control-sm"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            aria-label="Choose a profile photo"
            onChange={e => handleFileChange(e.target.files?.[0])}
          />

          {preview && (
            <Text size="1" color="gray">
              Preview — not saved yet.
            </Text>
          )}
        </Flex>

        {error && (
          <Callout.Root color="amber" size="1" mt="3">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <Flex gap="3" mt="4" justify="between" align="center">
          {user.avatarUrl ? (
            <AlertDialog.Root>
              <AlertDialog.Trigger>
                <Button variant="ghost" color="red" size="2">
                  Remove photo
                </Button>
              </AlertDialog.Trigger>
              <AlertDialog.Content maxWidth="380px">
                <AlertDialog.Title>Remove profile photo</AlertDialog.Title>
                <AlertDialog.Description size="2">
                  Your initials will be shown instead.
                </AlertDialog.Description>
                <Flex gap="3" mt="4" justify="end">
                  <AlertDialog.Cancel>
                    <Button variant="soft" color="gray">
                      Cancel
                    </Button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action>
                    <Button
                      color="red"
                      onClick={handleRemove}
                      loading={removing}
                    >
                      Remove
                    </Button>
                  </AlertDialog.Action>
                </Flex>
              </AlertDialog.Content>
            </AlertDialog.Root>
          ) : (
            <span />
          )}

          <Flex gap="3">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={handleSave} loading={saving} disabled={!preview}>
              Save photo
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
