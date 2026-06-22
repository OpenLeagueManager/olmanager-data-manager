"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { getEmbeddedCompetition } from "@/data/olmanager/embedded";
import { calculateLolOvr, PLAYER_RATING_HINT } from "@/data/olmanager/rating";
import { LOL_ROLES, PLAYER_ATTRIBUTE_KEYS, STAFF_ATTRIBUTE_KEYS } from "@/data/olmanager/types";
import { PROPOSAL_TYPE_METADATA } from "@/domain/proposals/metadata";
import type { FieldError, ProposalPayload, ProposalType } from "@/domain/proposals/types";
import { validateProposal } from "@/domain/proposals/validation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { RoleChip } from "@/components/ui/role-chip";
import { Select } from "@/components/ui/select";
import styles from "./proposal-ui.module.css";

const game = getEmbeddedCompetition();

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
    <form aria-labelledby={titleId} className={styles.stack} noValidate onSubmit={handleSubmit}>
      <fieldset className={styles.fieldset}>
        <legend id={titleId}>{PROPOSAL_TYPE_METADATA[proposalType as keyof typeof PROPOSAL_TYPE_METADATA]?.label ?? proposalType}</legend>
        <p className={styles.hint}>
          Browser constraints guide the form, but typed proposal validation is the source of truth.
        </p>
        {proposalType === "AddPlayer" ? <AddPlayerFields errors={errorMap} /> : null}
        {proposalType === "EditPlayer" ? <EditPlayerFields errors={errorMap} /> : null}
        {proposalType === "TransferPlayer" ? <TransferPlayerFields errors={errorMap} /> : null}
        {proposalType === "AddStaff" ? <AddStaffFields errors={errorMap} /> : null}
        {proposalType === "EditStaff" ? <EditStaffFields errors={errorMap} /> : null}
        {proposalType === "ReleaseStaff" ? <ReleaseStaffFields errors={errorMap} /> : null}
        {proposalType === "EditTeam" ? <EditTeamFields errors={errorMap} /> : null}
      </fieldset>
      <div className={styles.buttonRow}>
        <Button type="submit" variant="primary">
          Create draft proposal
        </Button>
      </div>
    </form>
  );
}

function AddPlayerFields({ errors }: { errors: ErrorMap }) {
  const [attributes, setAttributes] = useState<Record<string, string>>(() =>
    Object.fromEntries(PLAYER_ATTRIBUTE_KEYS.map((key) => [key, "75"])),
  );
  const ovr = useMemo(
    () =>
      calculateLolOvr(
        Object.fromEntries(
          PLAYER_ATTRIBUTE_KEYS.map((key) => [key, Number(attributes[key]) || 1]),
        ) as unknown as import("@/data/olmanager/types").PlayerAttributes,
      ),
    [attributes],
  );

  return (
    <>
      <TextField error={errors["player.full_name"]} label="Full name" name="player.full_name" required />
      <TextField error={errors["player.match_name"]} label="Match name" name="player.match_name" required />
      <RoleSelect error={errors["player.position"]} name="player.position" required />
      <TeamSelect error={errors["player.team_id"]} name="player.team_id" required />
      <TextField error={errors["player.nationality"]} label="Nationality" name="player.nationality" required />
      <NumberField error={errors["player.wage"]} label="Wage" name="player.wage" required />
      <NumberField error={errors["player.market_value"]} label="Market value" name="player.market_value" required />
      <TextField
        error={errors["player.date_of_birth"]}
        label="Date of birth"
        name="player.date_of_birth"
        placeholder="YYYY-MM-DD"
        required
        type="date"
      />
      <TextField
        error={errors["player.contract_end"]}
        label="Contract end"
        name="player.contract_end"
        placeholder="YYYY-MM-DD"
        type="date"
      />
      <AttributesField
        errorPrefix="player.attributes"
        errors={errors}
        keys={PLAYER_ATTRIBUTE_KEYS as unknown as string[]}
        onChange={setAttributes}
        values={attributes}
      />
      <OvrDisplay ovr={ovr} />
    </>
  );
}

function EditPlayerFields({ errors }: { errors: ErrorMap }) {
  return (
    <>
      <PlayerSelect error={errors.playerId} name="playerId" required />
      <TextField error={errors["changes.full_name"]} label="Full name" name="changes.full_name" />
      <TextField error={errors["changes.match_name"]} label="Match name" name="changes.match_name" />
      <RoleSelect error={errors["changes.position"]} includeBlank name="changes.position" />
      <TextField error={errors["changes.nationality"]} label="Nationality" name="changes.nationality" />
      <NumberField error={errors["changes.wage"]} label="Wage" name="changes.wage" />
      <NumberField error={errors["changes.market_value"]} label="Market value" name="changes.market_value" />
      <TextField error={errors["changes.contract_end"]} label="Contract end" name="changes.contract_end" type="date" />
      <TriStateSelect error={errors["changes.transfer_listed"]} label="Transfer listed" name="changes.transfer_listed" />
      <TriStateSelect error={errors["changes.loan_listed"]} label="Loan listed" name="changes.loan_listed" />
      <PartialAttributesField
        errorPrefix="changes.attributes"
        errors={errors}
        keys={PLAYER_ATTRIBUTE_KEYS as unknown as string[]}
        labelPrefix="Player"
      />
    </>
  );
}

function TransferPlayerFields({ errors }: { errors: ErrorMap }) {
  return (
    <>
      <PlayerSelect error={errors.playerId} name="playerId" required />
      <TeamSelect error={errors.fromTeamId} label="Source team" name="fromTeamId" required />
      <TeamSelect error={errors.toTeamId} label="Destination team" name="toTeamId" required />
      <CompetitionSelect error={errors.competitionId} name="competitionId" required />
      <NumberField error={errors.wageOffered} label="Wage offered" name="wageOffered" required />
      <NumberField error={errors.fee} label="Fee" name="fee" required />
      <TextField error={errors.contractEnd} label="Contract end" name="contractEnd" required type="date" />
    </>
  );
}

function AddStaffFields({ errors }: { errors: ErrorMap }) {
  return (
    <>
      <TextField error={errors["staff.first_name"]} label="First name" name="staff.first_name" required />
      <TextField error={errors["staff.last_name"]} label="Last name" name="staff.last_name" required />
      <TextField error={errors["staff.role"]} label="Role" name="staff.role" required />
      <TeamSelect error={errors["staff.team_id"]} label="Team" name="staff.team_id" required />
      <TextField error={errors["staff.nationality"]} label="Nationality" name="staff.nationality" required />
      <NumberField error={errors["staff.wage"]} label="Wage" name="staff.wage" required />
      <TextField error={errors["staff.contract_end"]} label="Contract end" name="staff.contract_end" type="date" />
      <TextField
        error={errors["staff.date_of_birth"]}
        label="Date of birth"
        name="staff.date_of_birth"
        required
        type="date"
      />
      <PartialAttributesField
        errorPrefix="staff.attributes"
        errors={errors}
        keys={STAFF_ATTRIBUTE_KEYS as unknown as string[]}
        labelPrefix="Staff"
        required
      />
    </>
  );
}

function EditStaffFields({ errors }: { errors: ErrorMap }) {
  return (
    <>
      <StaffSelect error={errors.staffId} name="staffId" required />
      <TextField error={errors["changes.role"]} label="Role" name="changes.role" />
      <NumberField error={errors["changes.wage"]} label="Wage" name="changes.wage" />
      <TextField error={errors["changes.contract_end"]} label="Contract end" name="changes.contract_end" type="date" />
      <PartialAttributesField
        errorPrefix="changes.attributes"
        errors={errors}
        keys={STAFF_ATTRIBUTE_KEYS as unknown as string[]}
        labelPrefix="Staff"
      />
    </>
  );
}

function ReleaseStaffFields({ errors }: { errors: ErrorMap }) {
  const reasonId = useId();
  return (
    <>
      <StaffSelect error={errors.staffId} name="staffId" required />
      <Field error={errors.reason} htmlFor={reasonId} label="Reason" required>
        <Select
          id={reasonId}
          name="reason"
          options={[
            { value: "fired", label: "Fired" },
            { value: "resigned", label: "Resigned" },
            { value: "contract_end", label: "Contract end" },
            { value: "mutual", label: "Mutual agreement" },
          ]}
          required
        />
      </Field>
      <NumberField error={errors.severance} label="Severance" name="severance" />
    </>
  );
}

function EditTeamFields({ errors }: { errors: ErrorMap }) {
  return (
    <>
      <TeamSelect error={errors.teamId} name="teamId" required />
      <TextField error={errors["changes.name"]} label="Name" name="changes.name" />
      <TextField error={errors["changes.short_name"]} label="Short name" name="changes.short_name" />
      <NumberField error={errors["changes.wage_budget"]} label="Wage budget" name="changes.wage_budget" />
      <NumberField error={errors["changes.transfer_budget"]} label="Transfer budget" name="changes.transfer_budget" />
      <TextField error={errors["changes.training_focus"]} label="Training focus" name="changes.training_focus" />
      <TextField error={errors["changes.training_intensity"]} label="Training intensity" name="changes.training_intensity" />
    </>
  );
}

function TextField({
  error,
  hint,
  label,
  name,
  required = false,
  type = "text",
  placeholder,
  defaultValue,
  onChange,
}: {
  error?: string;
  hint?: string;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  defaultValue?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const id = useId();
  return (
    <Field error={error} hint={hint} htmlFor={id} label={label} required={required}>
      <input
        className={styles.control}
        defaultValue={defaultValue}
        id={id}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </Field>
  );
}

function NumberField({
  error,
  label,
  name,
  required = false,
}: {
  error?: string;
  label: string;
  name: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <Field error={error} hint={PLAYER_RATING_HINT} htmlFor={id} label={label} required={required}>
      <input
        className={styles.control}
        id={id}
        min={0}
        name={name}
        required={required}
        step={1}
        type="number"
      />
    </Field>
  );
}

function RoleSelect({
  error,
  includeBlank = false,
  name,
  required = false,
}: {
  error?: string;
  includeBlank?: boolean;
  name: string;
  required?: boolean;
}) {
  const id = useId();
  const options = LOL_ROLES.map((role) => ({ value: role, label: role }));
  return (
    <Field error={error} htmlFor={id} label="Position" required={required}>
      <Select
        id={id}
        name={name}
        options={includeBlank ? [{ value: "", label: "No change" }, ...options] : options}
        placeholder={includeBlank ? undefined : "Select a role"}
        required={required}
      />
    </Field>
  );
}

function TeamSelect({
  error,
  label = "Team",
  name,
  required = false,
}: {
  error?: string;
  label?: string;
  name: string;
  required?: boolean;
}) {
  const id = useId();
  const options = game.teams.map((team) => ({ value: team.id, label: `${team.name} (${team.short_name})` }));
  return (
    <Field error={error} htmlFor={id} label={label} required={required}>
      <Select
        id={id}
        name={name}
        options={[{ value: "", label: "Select a team" }, ...options]}
        required={required}
      />
    </Field>
  );
}

function PlayerSelect({ error, name, required = false }: { error?: string; name: string; required?: boolean }) {
  const id = useId();
  const options = game.players.map((player) => ({
    value: player.id,
    label: `${player.match_name} (${player.position})`,
  }));
  return (
    <Field error={error} htmlFor={id} label="Player" required={required}>
      <Select
        id={id}
        name={name}
        options={[{ value: "", label: "Select a player" }, ...options]}
        required={required}
      />
    </Field>
  );
}

function StaffSelect({ error, name, required = false }: { error?: string; name: string; required?: boolean }) {
  const id = useId();
  const options = game.staff.map((staff) => ({
    value: staff.id,
    label: `${staff.first_name} ${staff.last_name} (${staff.role})`,
  }));
  return (
    <Field error={error} htmlFor={id} label="Staff member" required={required}>
      <Select
        id={id}
        name={name}
        options={[{ value: "", label: "Select a staff member" }, ...options]}
        required={required}
      />
    </Field>
  );
}

function CompetitionSelect({ error, name, required = false }: { error?: string; name: string; required?: boolean }) {
  const id = useId();
  return (
    <Field error={error} htmlFor={id} label="Competition" required={required}>
      <Select
        id={id}
        name={name}
        options={[
          { value: "", label: "Select a competition" },
          { value: game.manifest.id, label: game.manifest.name },
        ]}
        required={required}
      />
    </Field>
  );
}

function TriStateSelect({
  error,
  label,
  name,
}: {
  error?: string;
  label: string;
  name: string;
}) {
  const id = useId();
  return (
    <Field error={error} htmlFor={id} label={label}>
      <Select
        id={id}
        name={name}
        options={[
          { value: "", label: "No change" },
          { value: "true", label: "Yes" },
          { value: "false", label: "No" },
        ]}
      />
    </Field>
  );
}

function AttributesField({
  errorPrefix,
  errors,
  keys,
  onChange,
  values,
}: {
  errorPrefix: string;
  errors: ErrorMap;
  keys: string[];
  onChange: (values: Record<string, string>) => void;
  values: Record<string, string>;
}) {
  return (
    <div className={styles.stack}>
      <p className={styles.label}>Attributes</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {keys.map((key) => (
          <TextField
            defaultValue={values[key]}
            error={errors[`${errorPrefix}.${key}`]}
            key={key}
            label={key.replace(/_/g, " ")}
            name={`${errorPrefix}.${key}`}
            onChange={(event) =>
              onChange({ ...values, [key]: (event.target as HTMLInputElement).value })
            }
            required
            type="number"
          />
        ))}
      </div>
    </div>
  );
}

function PartialAttributesField({
  errorPrefix,
  errors,
  keys,
  labelPrefix,
  required = false,
}: {
  errorPrefix: string;
  errors: ErrorMap;
  keys: string[];
  labelPrefix: string;
  required?: boolean;
}) {
  return (
    <div className={styles.stack}>
      <p className={styles.label}>{labelPrefix} attributes</p>
      <p className={styles.hint}>Leave blank to keep the current value.</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {keys.map((key) => (
          <TextField
            error={errors[`${errorPrefix}.${key}`]}
            key={key}
            label={key.replace(/_/g, " ")}
            name={`${errorPrefix}.${key}`}
            required={required}
            type="number"
          />
        ))}
      </div>
    </div>
  );
}

function OvrDisplay({ ovr }: { ovr: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className={styles.label}>Computed OVR:</span>
      <RoleChip className="border-primary text-primary" role="Adc" showLabel={false} />
      <span className="font-heading text-lg font-semibold">{ovr}</span>
    </div>
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
        version: 2,
        type: "AddPlayer",
        player: {
          full_name: readFormString(formData, "player.full_name"),
          match_name: readFormString(formData, "player.match_name"),
          position: readFormString(formData, "player.position") as import("@/data/olmanager/types").LoLRole,
          team_id: readFormString(formData, "player.team_id"),
          nationality: readFormString(formData, "player.nationality"),
          wage: readFormNumber(formData, "player.wage"),
          market_value: readFormNumber(formData, "player.market_value"),
          date_of_birth: readFormString(formData, "player.date_of_birth"),
          contract_end: readFormString(formData, "player.contract_end"),
          attributes: readFormAttributes(formData, "player.attributes", PLAYER_ATTRIBUTE_KEYS as unknown as string[]) as unknown as import("@/data/olmanager/types").PlayerAttributes,
        },
      };
    case "EditPlayer":
      return {
        version: 2,
        type: "EditPlayer",
        playerId: readFormString(formData, "playerId"),
        changes: compactChanges({
          full_name: readFormString(formData, "changes.full_name"),
          match_name: readFormString(formData, "changes.match_name"),
          position: readFormString(formData, "changes.position") as import("@/data/olmanager/types").LoLRole,
          nationality: readFormString(formData, "changes.nationality"),
          wage: readOptionalFormNumber(formData, "changes.wage"),
          market_value: readOptionalFormNumber(formData, "changes.market_value"),
          contract_end: readFormString(formData, "changes.contract_end"),
          transfer_listed: readTriState(formData, "changes.transfer_listed"),
          loan_listed: readTriState(formData, "changes.loan_listed"),
          attributes: readPartialFormAttributes(formData, "changes.attributes", PLAYER_ATTRIBUTE_KEYS as unknown as string[]) as unknown as Partial<import("@/data/olmanager/types").PlayerAttributes>,
        }),
      };
    case "TransferPlayer":
      return {
        version: 2,
        type: "TransferPlayer",
        playerId: readFormString(formData, "playerId"),
        fromTeamId: readFormString(formData, "fromTeamId"),
        toTeamId: readFormString(formData, "toTeamId"),
        competitionId: readFormString(formData, "competitionId"),
        wageOffered: readFormNumber(formData, "wageOffered"),
        fee: readFormNumber(formData, "fee"),
        contractEnd: readFormString(formData, "contractEnd"),
      };
    case "AddStaff":
      return {
        version: 2,
        type: "AddStaff",
        staff: {
          first_name: readFormString(formData, "staff.first_name"),
          last_name: readFormString(formData, "staff.last_name"),
          role: readFormString(formData, "staff.role"),
          team_id: readFormString(formData, "staff.team_id"),
          nationality: readFormString(formData, "staff.nationality"),
          wage: readFormNumber(formData, "staff.wage"),
          contract_end: readFormString(formData, "staff.contract_end"),
          date_of_birth: readFormString(formData, "staff.date_of_birth"),
          attributes: readFormAttributes(formData, "staff.attributes", STAFF_ATTRIBUTE_KEYS as unknown as string[]) as unknown as import("@/data/olmanager/types").StaffAttributes,
        },
      };
    case "EditStaff":
      return {
        version: 2,
        type: "EditStaff",
        staffId: readFormString(formData, "staffId"),
        changes: compactChanges({
          role: readFormString(formData, "changes.role"),
          wage: readOptionalFormNumber(formData, "changes.wage"),
          contract_end: readFormString(formData, "changes.contract_end"),
          attributes: readPartialFormAttributes(formData, "changes.attributes", STAFF_ATTRIBUTE_KEYS as unknown as string[]) as unknown as Partial<import("@/data/olmanager/types").StaffAttributes>,
        }),
      };
    case "ReleaseStaff":
      return {
        version: 2,
        type: "ReleaseStaff",
        staffId: readFormString(formData, "staffId"),
        reason: readFormString(formData, "reason") as "fired" | "resigned" | "contract_end" | "mutual",
        severance: readOptionalFormNumber(formData, "severance"),
      };
    case "EditTeam":
      return {
        version: 2,
        type: "EditTeam",
        teamId: readFormString(formData, "teamId"),
        changes: compactChanges({
          name: readFormString(formData, "changes.name"),
          short_name: readFormString(formData, "changes.short_name"),
          wage_budget: readOptionalFormNumber(formData, "changes.wage_budget"),
          transfer_budget: readOptionalFormNumber(formData, "changes.transfer_budget"),
          training_focus: readFormString(formData, "changes.training_focus"),
          training_intensity: readFormString(formData, "changes.training_intensity"),
        }),
      };
    default:
      throw new Error(`Unsupported proposal type: ${proposalType}`);
  }
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

function readTriState(formData: FormData, name: string): boolean | undefined {
  const value = readFormString(formData, name);
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function readFormAttributes(formData: FormData, prefix: string, keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, readFormNumber(formData, `${prefix}.${key}`)]));
}

function readPartialFormAttributes(formData: FormData, prefix: string, keys: string[]) {
  const attributes: Record<string, number> = {};
  for (const key of keys) {
    const value = readOptionalFormNumber(formData, `${prefix}.${key}`);
    if (value !== undefined) {
      attributes[key] = value;
    }
  }
  return Object.keys(attributes).length > 0 ? attributes : undefined;
}

function compactChanges<T extends Record<string, unknown>>(changes: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(changes).filter(([, value]) => value !== "" && value !== undefined),
  ) as Partial<T>;
}
