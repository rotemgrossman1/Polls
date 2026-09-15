import TextInput from './TextInput';
import { COPY } from '../utils/uiCopy';
import { NICKNAME_ERROR, NICKNAME_MAX_LENGTH } from '../utils/nicknameRules';

const ERROR_COPY = {
  [NICKNAME_ERROR.EMPTY]: COPY.join.nicknameEmpty,
  [NICKNAME_ERROR.TAKEN]: COPY.join.nicknameTaken,
};

/**
 * Nickname entry for joining a poll (catalog: NicknameField): an emphasis card with a large
 * single-line TextInput, help text and a 20-character counter. Never prefilled.
 * - `error`: 'empty' | 'taken' | null.
 * - Enter submits the form the field belongs to, the same as "Join poll" (not while locked).
 */
export default function NicknameField({ id, value, onChange, error = null, readOnly = false, inputRef }) {
  function handleEnter(event) {
    const { form } = event.currentTarget;
    if (!readOnly && form) {
      form.requestSubmit();
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-text bg-action-subtle p-5 shadow-md">
      <TextInput
        id={id}
        label={COPY.join.nicknameLabel}
        helpText={COPY.join.nicknameHelp}
        value={value}
        onChange={onChange}
        maxLength={NICKNAME_MAX_LENGTH}
        placeholder={COPY.join.nicknamePlaceholder}
        large
        error={error ? ERROR_COPY[error] : null}
        readOnly={readOnly}
        autoComplete="nickname"
        enterKeyHint="go"
        onEnter={handleEnter}
        inputRef={inputRef}
      />
    </div>
  );
}
