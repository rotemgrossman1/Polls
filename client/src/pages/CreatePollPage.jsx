import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import Alert from '../components/Alert';
import AnswerTypeSelector from '../components/AnswerTypeSelector';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import OptionListEditor from '../components/OptionListEditor';
import PageLayout from '../components/PageLayout';
import TextInput from '../components/TextInput';
import useCreatePollForm, { SUBMIT_RESULT } from '../hooks/useCreatePollForm';
import { COPY } from '../utils/uiCopy';
import { POLL_LIMITS } from '../utils/pollRules';
import { ROUTES, pollCreatedPath } from '../utils/routes';
import { firstInvalidField } from '../utils/pollValidation';
import { hasUserInput } from '../utils/pollForm';

const FORM_ID = 'create-poll-form';

export default function CreatePollPage() {
  const navigate = useNavigate();
  const form = useCreatePollForm({
    onCreated: (poll) => navigate(pollCreatedPath(poll.id), { state: { poll } }),
  });
  const [discardOpen, setDiscardOpen] = useState(false);

  const questionRef = useRef(null);
  const detailsRef = useRef(null);
  const addDetailsRef = useRef(null);
  const optionFieldRefs = useRef(new Map());
  const pendingDetailsFocus = useRef(null);

  // After Add details / Remove details, focus the control that took its place.
  useEffect(() => {
    const target = pendingDetailsFocus.current === 'details' ? detailsRef.current : addDetailsRef.current;
    if (pendingDetailsFocus.current && target) {
      target.focus();
    }
    pendingDetailsFocus.current = null;
  }, [form.detailsShown]);

  function handleShowDetails() {
    pendingDetailsFocus.current = 'details';
    form.showDetails();
  }

  function handleHideDetails() {
    pendingDetailsFocus.current = 'addDetails';
    form.hideDetails();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await form.submit();
    if (result.status === SUBMIT_RESULT.INVALID) {
      const first = firstInvalidField(result.errors, form.options);
      const field = first === 'question' ? questionRef.current : optionFieldRefs.current.get(first);
      if (field) {
        field.focus();
      }
    }
  }

  // Cancel asks before discarding anything the user entered.
  function handleCancel() {
    if (hasUserInput(form)) {
      setDiscardOpen(true);
    } else {
      navigate(ROUTES.home);
    }
  }

  const bottomBar = (
    <>
      <Button variant="ghost" size="sm" block="mobile" disabled={form.saving} onClick={handleCancel}>
        {COPY.form.cancelButton}
      </Button>
      <Button type="submit" form={FORM_ID} block="mobile" loading={form.saving}>
        {form.saving ? COPY.form.creatingButton : COPY.form.createButton}
      </Button>
    </>
  );

  return (
    <PageLayout bottomBar={bottomBar}>
      <h1 className="break-words text-2xl font-bold leading-tight text-text">{COPY.form.heading}</h1>
      <form id={FORM_ID} noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 rounded-lg border border-text bg-action-subtle p-5 shadow-md">
          <TextInput
            id="poll-question"
            label={COPY.form.questionLabel}
            placeholder={COPY.form.questionPlaceholder}
            value={form.question}
            onChange={form.setQuestion}
            maxLength={POLL_LIMITS.QUESTION_MAX_LENGTH}
            large
            error={form.errors.question ? COPY.errors.questionEmpty : null}
            readOnly={form.saving}
            inputRef={questionRef}
          />
          {form.detailsShown ? (
            <>
              <TextInput
                id="poll-details"
                label={COPY.form.detailsLabel}
                placeholder={COPY.form.detailsPlaceholder}
                value={form.details}
                onChange={form.setDetails}
                maxLength={POLL_LIMITS.DETAILS_MAX_LENGTH}
                variant="multiline"
                readOnly={form.saving}
                inputRef={detailsRef}
              />
              <div>
                <Button variant="ghost" size="sm" icon="x" disabled={form.saving} onClick={handleHideDetails}>
                  {COPY.form.removeDetails}
                </Button>
              </div>
            </>
          ) : (
            <div>
              <Button
                ref={addDetailsRef}
                variant="ghost"
                size="sm"
                icon="plus"
                disabled={form.saving}
                onClick={handleShowDetails}
              >
                {COPY.form.addDetails}
              </Button>
            </div>
          )}
        </div>

        <AnswerTypeSelector value={form.answerType} onChange={form.setAnswerType} disabled={form.saving} />

        <OptionListEditor
          options={form.options}
          errors={form.errors.options}
          canAdd={form.canAddOption}
          canRemove={form.canRemoveOption}
          locked={form.saving}
          fieldRefs={optionFieldRefs}
          onAdd={form.addOption}
          onRemove={form.removeOption}
          onChangeText={form.setOptionText}
          onMove={form.moveOption}
        />

        {form.saveFailed && <Alert>{COPY.errors.saveFailed}</Alert>}
      </form>

      <ConfirmDialog
        open={discardOpen}
        title={COPY.discardDialog.title}
        body={COPY.discardDialog.body}
        confirmLabel={COPY.discardDialog.discard}
        cancelLabel={COPY.discardDialog.keepEditing}
        onConfirm={() => navigate(ROUTES.home)}
        onCancel={() => setDiscardOpen(false)}
      />
    </PageLayout>
  );
}
