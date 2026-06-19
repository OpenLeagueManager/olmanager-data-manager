"use client";

import { useId, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { PROPOSAL_TYPE_METADATA } from "@/domain/proposals/metadata";
import { PLAYER_RATING_HINT, PLAYER_RATING_MAX, PLAYER_RATING_MIN } from "@/domain/proposals/rating";
import { competitions, players, teams } from "@/fixtures/olmanager-data";
import type { FieldError, ProposalPayload, ProposalType } from "@/domain/proposals/types";
import { validateProposal } from "@/domain/proposals/validation";
import styles from "./proposal-ui.module.css";

type ProposalFormProps = {
  proposalType: ProposalType;
  onProposalAccepted: (proposal: ProposalPayload) => void;
};

export function ProposalForm({ proposalType, onProposalAccepted }: ProposalFormProps) {
  const [errors, setErrors] = useState<FieldError[]>([]);
  const titleId = useId();
  const errorMap = useMemo(() => groupErrorsByField(errors), [errors]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    syncAllAriaInvalid(event.currentTarget);

    const payload = payloadFromForm(proposalType, new FormData(event.currentTarget));
    const result = validateProposal(payload);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setErrors([]);
    onProposalAccepted(result.value);
    event.currentTarget.reset();
  }

  return (
    <form
      aria-labelledby={titleId}
      className={styles.stack}
      noValidate={false}
      onBlur={(event) => syncAriaInvalid(event.target)}
      onInput={(event) => clearAriaInvalidWhenValid(event.target)}
      onInvalid={(event) => syncAriaInvalid(event.target)}
      onSubmit={handleSubmit}
    >
      <fieldset className={styles.fieldset}>
        <legend id={titleId}>{PROPOSAL_TYPE_METADATA[proposalType].label}</legend>
        <p className={styles.hint}>
          Browser constraints guide the form, but typed proposal validation is the source of truth.
        </p>
        {proposalType === "AddPlayer" ? <AddPlayerFields errors={errorMap} /> : null}
        {proposalType === "EditPlayerAttributes" ? (
          <EditPlayerAttributesFields errors={errorMap} />
        ) : null}
        {proposalType === "TransferPlayer" ? <TransferPlayerFields errors={errorMap} /> : null}
      </fieldset>
      <div className={styles.buttonRow}>
        <button className={`${styles.button} ${styles.primaryButton}`} type="submit">
          Create draft proposal
        </button>
      </div>
    </form>
  );
}

function AddPlayerFields({ errors }: { errors: ErrorMap }) {
  return (
    <>
      <TextField
        error={errors["player.id"]}
        hint="Use a unique OLManager player ID."
        label="Player ID"
        name="player.id"
        required
      />
      <TextField error={errors["player.name"]} label="Player name" name="player.name" required />
      <PositionField error={errors["player.position"]} name="player.position" />
      <TeamField error={errors["player.teamId"]} name="player.teamId" />
      <CompetitionField error={errors["player.competitionId"]} name="player.competitionId" />
      <RatingField error={errors["player.overall"]} name="player.overall" />
    </>
  );
}

function EditPlayerAttributesFields({ errors }: { errors: ErrorMap }) {
  return (
    <>
      <PlayerField error={errors.playerId} name="playerId" />
      {errors.attributes ? <FormError message={errors.attributes} /> : null}
      <TextField
        error={errors["attributes.name"]}
        hint="Leave unchanged fields blank. At least one attribute is required."
        label="New player name"
        name="attributes.name"
      />
      <PositionField error={errors["attributes.position"]} includeBlank name="attributes.position" />
      <RatingField error={errors["attributes.overall"]} name="attributes.overall" required={false} />
    </>
  );
}

function TransferPlayerFields({ errors }: { errors: ErrorMap }) {
  return (
    <>
      <PlayerField error={errors.playerId} name="playerId" />
      <TeamField error={errors.fromTeamId} label="Current team" name="fromTeamId" />
      <TeamField error={errors.toTeamId} label="Destination team" name="toTeamId" />
      <CompetitionField error={errors.competitionId} name="competitionId" />
    </>
  );
}

function TextField({
  error,
  hint,
  label,
  name,
  required = false,
}: {
  error?: string;
  hint?: string;
  label: string;
  name: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <FieldFrame error={error} hint={hint} id={id} label={label}>
      <input
        aria-describedby={descriptionIds(id, hint, error)}
        aria-errormessage={`${id}-error`}
        className={styles.control}
        id={id}
        name={name}
        required={required}
        type="text"
      />
    </FieldFrame>
  );
}

function RatingField({
  error,
  name,
  required = true,
}: {
  error?: string;
  name: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <FieldFrame error={error} hint={PLAYER_RATING_HINT} id={id} label="Overall rating">
      <input
        aria-describedby={descriptionIds(id, true, error)}
        aria-errormessage={`${id}-error`}
        className={styles.control}
        id={id}
        max={PLAYER_RATING_MAX}
        min={PLAYER_RATING_MIN}
        name={name}
        required={required}
        step={1}
        type="number"
      />
    </FieldFrame>
  );
}

function PositionField({
  error,
  includeBlank = false,
  name,
}: {
  error?: string;
  includeBlank?: boolean;
  name: string;
}) {
  const id = useId();
  return (
    <FieldFrame error={error} id={id} label="Position">
      <select
        aria-describedby={descriptionIds(id, false, error)}
        aria-errormessage={`${id}-error`}
        className={styles.control}
        id={id}
        name={name}
        required={!includeBlank}
      >
        {includeBlank ? <option value="">No position change</option> : null}
        <option value="GK">Goalkeeper</option>
        <option value="DF">Defender</option>
        <option value="MF">Midfielder</option>
        <option value="FW">Forward</option>
      </select>
    </FieldFrame>
  );
}

function PlayerField({ error, name }: { error?: string; name: string }) {
  const id = useId();
  return (
    <FieldFrame error={error} id={id} label="Player">
      <select
        aria-describedby={descriptionIds(id, false, error)}
        aria-errormessage={`${id}-error`}
        className={styles.control}
        id={id}
        name={name}
        required
      >
        <option value="">Select a player</option>
        {players.map((player) => (
          <option key={player.id} value={player.id}>
            {player.name}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}

function TeamField({
  error,
  label = "Team",
  name,
}: {
  error?: string;
  label?: string;
  name: string;
}) {
  const id = useId();
  return (
    <FieldFrame error={error} id={id} label={label}>
      <select
        aria-describedby={descriptionIds(id, false, error)}
        aria-errormessage={`${id}-error`}
        className={styles.control}
        id={id}
        name={name}
        required
      >
        <option value="">Select a team</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}

function CompetitionField({ error, name }: { error?: string; name: string }) {
  const id = useId();
  return (
    <FieldFrame error={error} id={id} label="Competition">
      <select
        aria-describedby={descriptionIds(id, false, error)}
        aria-errormessage={`${id}-error`}
        className={styles.control}
        id={id}
        name={name}
        required
      >
        <option value="">Select a competition</option>
        {competitions.map((competition) => (
          <option key={competition.id} value={competition.id}>
            {competition.name}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}

function FieldFrame({
  children,
  error,
  hint,
  id,
  label,
}: {
  children: ReactNode;
  error?: string;
  hint?: string;
  id: string;
  label: string;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {hint ? (
        <span className={styles.hint} id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
      {children}
      <span className={styles.fieldError} data-visible={Boolean(error)} id={`${id}-error`} role={error ? "alert" : undefined}>
        {error ?? "This field needs a valid value."}
      </span>
    </div>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <p className={styles.fieldError} data-visible="true" role="alert">
      {message}
    </p>
  );
}

type ErrorMap = Record<string, string | undefined>;

function groupErrorsByField(errors: FieldError[]): ErrorMap {
  return Object.fromEntries(errors.map((error) => [error.field, error.message]));
}

function payloadFromForm(proposalType: ProposalType, formData: FormData): ProposalPayload {
  switch (proposalType) {
    case "AddPlayer":
      return {
        type: "AddPlayer",
        player: {
          id: readFormString(formData, "player.id"),
          name: readFormString(formData, "player.name"),
          position: readFormString(formData, "player.position"),
          teamId: readFormString(formData, "player.teamId"),
          competitionId: readFormString(formData, "player.competitionId"),
          overall: readFormNumber(formData, "player.overall"),
        },
      } as ProposalPayload;
    case "EditPlayerAttributes":
      return {
        type: "EditPlayerAttributes",
        playerId: readFormString(formData, "playerId"),
        attributes: compactAttributes({
          name: readFormString(formData, "attributes.name"),
          position: readFormString(formData, "attributes.position"),
          overall: readOptionalFormNumber(formData, "attributes.overall"),
        }),
      } as ProposalPayload;
    case "TransferPlayer":
      return {
        type: "TransferPlayer",
        playerId: readFormString(formData, "playerId"),
        fromTeamId: readFormString(formData, "fromTeamId"),
        toTeamId: readFormString(formData, "toTeamId"),
        competitionId: readFormString(formData, "competitionId"),
      };
  }
}

function compactAttributes(attributes: Record<string, string | number | undefined>) {
  return Object.fromEntries(
    Object.entries(attributes).filter(([, value]) => value !== "" && value !== undefined),
  );
}

function readFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function readFormNumber(formData: FormData, name: string) {
  const value = Number(readFormString(formData, name));
  return Number.isFinite(value) ? value : Number.NaN;
}

function readOptionalFormNumber(formData: FormData, name: string) {
  const value = readFormString(formData, name);
  return value === "" ? undefined : Number(value);
}

function descriptionIds(id: string, hasHint: string | boolean | undefined, error?: string) {
  const parts: string[] = [];
  if (hasHint) {
    parts.push(`${id}-hint`);
  }
  if (error) {
    parts.push(`${id}-error`);
  }
  return parts.join(" ") || undefined;
}

function syncAllAriaInvalid(form: HTMLFormElement) {
  for (const element of Array.from(form.elements)) {
    syncAriaInvalid(element);
  }
}

function syncAriaInvalid(target: EventTarget | Element) {
  if (!isFormControl(target)) {
    return;
  }

  const isInvalid = !target.validity.valid;
  target.setAttribute("aria-invalid", String(isInvalid));
  target.toggleAttribute("data-user-invalid", isInvalid);
}

function clearAriaInvalidWhenValid(target: EventTarget | Element) {
  if (!isFormControl(target) || target.getAttribute("aria-invalid") !== "true") {
    return;
  }

  syncAriaInvalid(target);
}

function isFormControl(
  target: EventTarget | Element,
): target is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  );
}
